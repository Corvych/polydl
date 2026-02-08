package repositories

import (
	"polydl/models"

	"gorm.io/gorm"
)

type SubjectRepository struct {
	DB *gorm.DB
}

func NewSubjectRepository(db *gorm.DB) *SubjectRepository {
	return &SubjectRepository{DB: db}
}

func (r *SubjectRepository) GetAll() ([]models.Subject, error) {
	var subjects []models.Subject
	result := r.DB.Find(&subjects)
	return subjects, result.Error
}

func (r *SubjectRepository) GetByGroupID(groupID uint) ([]models.Subject, error) {
	var subjects []models.Subject
	result := r.DB.Where("group_id = ?", groupID).Find(&subjects)
	return subjects, result.Error
}

func (r *SubjectRepository) GetByID(id uint) (*models.Subject, error) {
	var subject models.Subject
	result := r.DB.First(&subject, id)
	return &subject, result.Error
}

func (r *SubjectRepository) GetByShortlink(shortlink string) (*models.Subject, error) {
	var subject models.Subject
	result := r.DB.Where("shortlink = ?", shortlink).First(&subject)
	return &subject, result.Error
}

func (r *SubjectRepository) Create(subject *models.Subject) error {
	return r.DB.Create(subject).Error
}

func (r *SubjectRepository) Update(subject *models.Subject) error {
	return r.DB.Save(subject).Error
}

func (r *SubjectRepository) Delete(id uint) error {
	return r.DB.Delete(&models.Subject{}, id).Error
}
