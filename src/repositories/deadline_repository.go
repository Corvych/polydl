package repositories

import (
	"polydl/models"

	"gorm.io/gorm"
)

type DeadlineRepository struct {
	DB *gorm.DB
}

func NewDeadlineRepository(db *gorm.DB) *DeadlineRepository {
	return &DeadlineRepository{DB: db}
}

func (r *DeadlineRepository) GetAllWithSubject() ([]models.Deadline, error) {
	var deadlines []models.Deadline
	result := r.DB.Preload("Subject").Order("ts_due asc").Find(&deadlines)
	return deadlines, result.Error
}

func (r *DeadlineRepository) GetBySubjectID(subjectID uint) ([]models.Deadline, error) {
	var deadlines []models.Deadline
	result := r.DB.Preload("Subject").Where("subject_id = ?", subjectID).Order("ts_due asc").Find(&deadlines)
	return deadlines, result.Error
}

func (r *DeadlineRepository) GetByID(id uint) (*models.Deadline, error) {
	var deadline models.Deadline
	result := r.DB.First(&deadline, id)
	return &deadline, result.Error
}

func (r *DeadlineRepository) Create(deadline *models.Deadline) error {
	return r.DB.Create(deadline).Error
}

func (r *DeadlineRepository) Update(deadline *models.Deadline) error {
	return r.DB.Save(deadline).Error
}

func (r *DeadlineRepository) Delete(id uint) error {
	return r.DB.Delete(&models.Deadline{}, id).Error
}
