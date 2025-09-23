import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

import { TasksService } from '../../../../openapi/generated/services/tasks.service';
import { NotificationService } from '../../../shared/notification.service';
import { CategoryWithDetails } from '../category';
import { ResidenceOut } from '../../../../openapi/generated/models/residence-out';

export interface FormData {
  category?: CategoryWithDetails;
  residences: ResidenceOut[];
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-category-form-modal',
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
    MatIconModule
  ],
  templateUrl: './category-form-modal.html',
  styleUrl: './category-form-modal.scss'
})
export class CategoryFormModal implements OnInit {
  protected readonly dialogRef = inject(MatDialogRef<CategoryFormModal>);
  protected readonly data = inject(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly tasksService = inject(TasksService);
  private readonly notificationService = inject(NotificationService);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    residence_id: ['', Validators.required]
  });

  readonly isLoading = signal(false);
  readonly isEditMode = computed(() => this.data.mode === 'edit');

  ngOnInit(): void {
    if (this.data.category) {
      this.form.patchValue({
        name: this.data.category.name,
        residence_id: this.data.category.residence_id
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = this.form.value;

    if (this.isEditMode()) {
      this.tasksService.updateCategoryTasksCategoriesCategoryIdPut({
        category_id: this.data.category!.id,
        body: formData
      }).subscribe({
        next: () => {
          this.notificationService.success('Category updated successfully');
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.notificationService.error('Error updating category');
          this.isLoading.set(false);
        }
      });
    } else {
      this.tasksService.createCategoryTasksCategoriesPost({
        body: formData
      }).subscribe({
        next: () => {
          this.notificationService.success('Category created successfully');
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.notificationService.error('Error creating category');
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