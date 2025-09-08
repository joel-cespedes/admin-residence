#!/bin/bash

# Script para extraer todo el contenido de archivos de un proyecto Angular
# Incluye: archivos .ts, .html, .scss dentro de src/* y projects/* (excluyendo .spec.ts) + angular.json + estructura de directorios

# Configuración
PROJECT_PATH="${1:-.}"
OUTPUT_FILE="${2:-angular_project_content.txt}"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [ruta_proyecto] [archivo_salida]"
    echo ""
    echo "Parámetros:"
    echo "  ruta_proyecto    Ruta al proyecto Angular (default: directorio actual)"
    echo "  archivo_salida   Archivo de salida (default: angular_project_content.txt)"
    echo ""
    echo "Ejemplo:"
    echo "  $0 /ruta/a/mi/proyecto mi_contenido.txt"
    echo ""
    echo "Extrae:"
    echo "  - Aplicación principal (src/*)"
    echo "  - Librerías (projects/*)"
    echo "  - angular.json"
    echo "  - Estructura de directorios"
    exit 0
}

# Verificar si se pide ayuda
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
fi

# Verificar que el directorio existe
if [[ ! -d "$PROJECT_PATH" ]]; then
    echo -e "${RED}Error: El directorio '$PROJECT_PATH' no existe${NC}"
    exit 1
fi

# Convertir a ruta absoluta
PROJECT_PATH=$(cd "$PROJECT_PATH" && pwd)

echo -e "${GREEN}Procesando proyecto Angular en: $PROJECT_PATH${NC}"
echo -e "${YELLOW}Archivo de salida: $OUTPUT_FILE${NC}"

# Limpiar archivo de salida si existe
> "$OUTPUT_FILE"

# Escribir encabezado
cat > "$OUTPUT_FILE" << EOF
CONTENIDO COMPLETO DEL PROYECTO ANGULAR
======================================
Proyecto: $PROJECT_PATH
Generado: $(date '+%Y-%m-%d %H:%M:%S')
======================================

EOF

# Contadores
file_count=0
total_size=0

# Función para escribir separador de archivo
write_file_separator() {
    local file_path="$1"
    local tree_location="$2"
    echo "" >> "$OUTPUT_FILE"
    echo "================================================================================" >> "$OUTPUT_FILE"
    echo "ARCHIVO: $file_path" >> "$OUTPUT_FILE"
    if [[ -n "$tree_location" ]]; then
        echo "UBICACIÓN EN ÁRBOL: $tree_location" >> "$OUTPUT_FILE"
    fi
    echo "================================================================================" >> "$OUTPUT_FILE"
}

# Función para generar árbol de directorios simplificado
generate_tree() {
    local base_path="$1"
    local prefix="$2"
    
    if command -v tree &> /dev/null; then
        echo -e "${BLUE}Generando árbol con comando 'tree'${NC}"
        tree "$base_path" -I 'node_modules|dist|.git|.angular' --dirsfirst
    else
        echo -e "${BLUE}Generando árbol manual${NC}"
        find "$base_path" -type d \( -name "node_modules" -o -name "dist" -o -name ".git" -o -name ".angular" \) -prune -o -type d -print | sort | sed "s|$base_path|$prefix|"
    fi
}

# Generar y escribir estructura de directorios
echo -e "${BLUE}Generando estructura de directorios...${NC}"
cat >> "$OUTPUT_FILE" << EOF

ESTRUCTURA DE DIRECTORIOS DEL PROYECTO
=====================================
EOF

# Árbol completo del proyecto
echo "" >> "$OUTPUT_FILE"
echo "ÁRBOL COMPLETO:" >> "$OUTPUT_FILE"
echo "===============" >> "$OUTPUT_FILE"
generate_tree "$PROJECT_PATH" "." >> "$OUTPUT_FILE"

# Si existe projects/, mostrar árbol específico de librerías
if [[ -d "$PROJECT_PATH/projects" ]]; then
    echo "" >> "$OUTPUT_FILE"
    echo "LIBRERÍAS (projects/):" >> "$OUTPUT_FILE"
    echo "=====================" >> "$OUTPUT_FILE"
    generate_tree "$PROJECT_PATH/projects" "projects" >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"
echo "=====================================" >> "$OUTPUT_FILE"

# Procesar angular.json si existe
if [[ -f "$PROJECT_PATH/angular.json" ]]; then
    echo -e "${CYAN}Procesando: angular.json${NC}"
    write_file_separator "angular.json" "/ (raíz del proyecto)"
    cat "$PROJECT_PATH/angular.json" >> "$OUTPUT_FILE"
    ((file_count++))
    size=$(wc -c < "$PROJECT_PATH/angular.json")
    total_size=$((total_size + size))
fi

# Función para procesar archivos en un directorio
process_files_in_directory() {
    local search_path="$1"
    local section_name="$2"
    local relative_prefix="$3"
    
    echo -e "${YELLOW}Procesando $section_name...${NC}"
    
    if [[ ! -d "$search_path" ]]; then
        return
    fi
    
    # Encontrar y procesar archivos
    find "$search_path" -type f \( -name "*.ts" -o -name "*.html" -o -name "*.scss" -o -name "*.css" \) ! -name "*.spec.ts" | sort | while read -r file; do
        # Obtener ruta relativa
        relative_path="${file#$PROJECT_PATH/}"
        
        # Generar ubicación en árbol
        dir_path=$(dirname "$file")
        tree_location="${dir_path#$PROJECT_PATH/}"
        if [[ "$tree_location" == "$dir_path" ]]; then
            tree_location="/"
        fi
        
        echo -e "${CYAN}Procesando: $relative_path${NC}"
        
        # Escribir separador con ubicación
        write_file_separator "$relative_path" "$tree_location/"
        
        # Verificar si el archivo tiene contenido
        if [[ -s "$file" ]]; then
            cat "$file" >> "$OUTPUT_FILE"
        else
            echo "[ARCHIVO VACÍO]" >> "$OUTPUT_FILE"
        fi
        
        # Actualizar contadores
        ((file_count++))
        size=$(wc -c < "$file" 2>/dev/null || echo 0)
        total_size=$((total_size + size))
    done
}

# Procesar aplicación principal
if [[ -d "$PROJECT_PATH/src" ]]; then
    cat >> "$OUTPUT_FILE" << EOF


################################################################################
#                           APLICACIÓN PRINCIPAL (src/)                        #
################################################################################
EOF
    process_files_in_directory "$PROJECT_PATH/src" "aplicación principal (src/)" "src"
else
    echo -e "${RED}Advertencia: No se encontró la carpeta 'src' en el proyecto${NC}"
fi

# Procesar librerías
if [[ -d "$PROJECT_PATH/projects" ]]; then
    cat >> "$OUTPUT_FILE" << EOF


################################################################################
#                            LIBRERÍAS (projects/)                            #
################################################################################
EOF
    
    # Listar librerías encontradas
    echo -e "${YELLOW}Librerías encontradas:${NC}"
    for lib_dir in "$PROJECT_PATH/projects"/*/; do
        if [[ -d "$lib_dir" ]]; then
            lib_name=$(basename "$lib_dir")
            echo -e "${CYAN}  - $lib_name${NC}"
            
            # Agregar separador para cada librería
            cat >> "$OUTPUT_FILE" << EOF

================================================================================
                              LIBRERÍA: $lib_name
================================================================================
EOF
            
            process_files_in_directory "$lib_dir" "librería $lib_name" "projects/$lib_name"
        fi
    done
else
    echo -e "${YELLOW}No se encontraron librerías (carpeta projects/ no existe)${NC}"
fi

# Calcular tamaño en KB
total_size_kb=$((total_size / 1024))




echo -e "${GREEN}¡Extracción completada exitosamente!${NC}"
echo -e "${YELLOW}Archivos procesados: $file_count${NC}"
echo -e "${YELLOW}Archivo generado: $OUTPUT_FILE${NC}"
echo -e "${YELLOW}Tamaño del archivo: $(wc -c < "$OUTPUT_FILE" | awk '{print int($1/1024)}') KB${NC}"

# Mostrar resumen de lo que se procesó
echo ""
echo -e "${GREEN}RESUMEN DE PROCESAMIENTO:${NC}"
echo -e "${CYAN}✓ Aplicación principal (src/)${NC}"
if [[ -d "$PROJECT_PATH/projects" ]]; then
    echo -e "${CYAN}✓ Librerías encontradas:${NC}"
    for lib_dir in "$PROJECT_PATH/projects"/*/; do
        if [[ -d "$lib_dir" ]]; then
            lib_name=$(basename "$lib_dir")
            echo -e "${CYAN}  - $lib_name${NC}"
        fi
    done
fi
echo -e "${CYAN}✓ Configuración (angular.json)${NC}"
echo -e "${CYAN}✓ Estructura de directorios${NC}"


echo -e "${GREEN}Script finalizado.${NC}"