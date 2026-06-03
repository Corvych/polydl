package repositories

import (
	"polydl/models"
	"time"

	"gorm.io/gorm"
)

type DeadlineRepository struct {
	DB *gorm.DB
}

func NewDeadlineRepository(db *gorm.DB) *DeadlineRepository {
	return &DeadlineRepository{DB: db}
}

func (r *DeadlineRepository) GetDeadlinesForUser(userID uint, groupID uint, subjectID *uint) ([]models.Deadline, error) {
	var deadlines []models.Deadline

	query := r.DB.Preload("Subject").
		Where("(user_id = ? OR group_id = ?)", userID, groupID)

	if subjectID != nil {
		query = query.Where("subject_id = ?", *subjectID)
	}

	result := query.Order("ts_due asc").Find(&deadlines)
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
	return r.DB.Transaction(func(tx *gorm.DB) error {
		// Remove join table entries to avoid FK constraint violations
		if err := tx.Exec("DELETE FROM user_completed_deadlines WHERE deadline_id = ?", id).Error; err != nil {
			return err
		}
		return tx.Delete(&models.Deadline{}, id).Error
	})
}

func (r *DeadlineRepository) DeleteExpired(threshold time.Time) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		// Remove join table entries for expired deadlines
		if err := tx.Exec("DELETE FROM user_completed_deadlines WHERE deadline_id IN (SELECT id FROM deadlines WHERE ts_due < ?)", threshold).Error; err != nil {
			return err
		}
		return tx.Where("ts_due < ?", threshold).Delete(&models.Deadline{}).Error
	})
}
