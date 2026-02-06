package repositories

import (
	"polydl/models"

	"gorm.io/gorm"
)

type GroupRepository struct {
	DB *gorm.DB
}

func NewGroupRepository(db *gorm.DB) *GroupRepository {
	return &GroupRepository{DB: db}
}

func (r *GroupRepository) GetAll() ([]models.Group, error) {
	var groups []models.Group
	result := r.DB.Find(&groups)
	return groups, result.Error
}

func (r *GroupRepository) GetByID(id uint) (*models.Group, error) {
	var group models.Group
	result := r.DB.First(&group, id)
	return &group, result.Error
}

func (r *GroupRepository) Create(group *models.Group) error {
	return r.DB.Create(group).Error
}

func (r *GroupRepository) Update(group *models.Group) error {
	return r.DB.Save(group).Error
}

func (r *GroupRepository) Delete(id uint) error {
	return r.DB.Delete(&models.Group{}, id).Error
}
