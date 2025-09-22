import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';

import { TasksService } from '../../../../openapi/generated/services/tasks.service';
import { NotificationService } from '../../../shared/notification.service';
import { TaskWithDetails } from '../task';
import { ResidenceOut } from '../../../../openapi/generated/models/residence-out';
import { TaskCategoryOut } from '../../../../openapi/generated/models/task-category-out';

export interface FormData {
  task?: TaskWithDetails;
  residences: ResidenceOut[];
  categories: TaskCategoryOut[];
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-task-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './task-form-modal.html',
  styleUrl: './task-form-modal.scss'
})
export class TaskFormModal implements OnInit {
  protected readonly dialogRef = inject(MatDialogRef<TaskFormModal>);
  protected readonly data = inject(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly tasksService = inject(TasksService);
  private readonly notificationService = inject(NotificationService);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    residence_id: ['', Validators.required],
    task_category_id: ['', Validators.required],
    audio_phrase: [''],
    is_block: [false],
    status1: [''],
    status2: [''],
    status3: [''],
    status4: [''],
    status5: [''],
    status6: ['']
  });

  readonly isLoading = signal(false);
  readonly isLoadingCategories = signal(false);
  readonly categories = signal<TaskCategoryOut[]>([]);
  readonly isEditMode = computed(() => this.data.mode === 'edit');

  ngOnInit(): void {
    // Initialize with existing categories if provided
    if (this.data.categories) {
      this.categories.set(this.data.categories);
    }

    if (this.data.task) {
      this.form.patchValue({
        name: this.data.task.name,
        residence_id: this.data.task.residence_id,
        task_category_id: this.data.task.task_category_id,
        audio_phrase: this.data.task.audio_phrase || '',
        is_block: this.data.task.is_block || false,
        status1: this.data.task.status1 || '',
        status2: this.data.task.status2 || '',
        status3: this.data.task.status3 || '',
        status4: this.data.task.status4 || '',
        status5: this.data.task.status5 || '',
        status6: this.data.task.status6 || ''
      });

      // Load categories for the task's residence
      if (this.data.task.residence_id) {
        this.loadCategoriesForResidence(this.data.task.residence_id);
      }

      // Disable residence field when editing
      if (this.isEditMode()) {
        this.form.get('residence_id')?.disable();
      }
    }
  }

  onResidenceChange(residenceId: string): void {
    // Only allow residence change in create mode
    if (this.isEditMode()) {
      return;
    }

    this.form.patchValue({ task_category_id: '' }); // Reset category selection
    this.categories.set([]); // Clear categories

    if (residenceId) {
      this.loadCategoriesForResidence(residenceId);
    }
  }

  private loadCategoriesForResidence(residenceId: string): void {
    this.isLoadingCategories.set(true);
    const params: any = { size: 100 };
    if (residenceId) {
      params.residence_id = residenceId;
    }

    this.tasksService.listCategoriesTasksCategoriesGet(params).subscribe({
      next: (categories: any) => {
        this.categories.set(categories.items || []);
        this.isLoadingCategories.set(false);
      },
      error: () => {
        this.notificationService.error('Error loading categories');
        this.isLoadingCategories.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = this.form.value;

    if (this.isEditMode()) {
      this.tasksService
        .updateTemplateTasksTemplatesTemplateIdPatch({
          template_id: this.data.task!.id,
          body: formData
        })
        .subscribe({
          next: () => {
            this.notificationService.success('Task updated successfully');
            this.dialogRef.close(true);
          },
          error: () => {
            this.notificationService.error('Error updating task');
            this.isLoading.set(false);
          }
        });
    } else {
      this.tasksService
        .createTemplateTasksTemplatesPost({
          body: formData
        })
        .subscribe({
          next: () => {
            this.notificationService.success('Task created successfully');
            this.dialogRef.close(true);
          },
          error: () => {
            this.notificationService.error('Error creating task');
            this.isLoading.set(false);
          }
        });
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'This field is required';
      }
      if (control.errors['minlength']) {
        return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['maxlength']) {
        return `Maximum length is ${control.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
