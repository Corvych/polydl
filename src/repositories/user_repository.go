package repositories

import (
	"polydl/models"

	"gorm.io/gorm"
)

type UserRepository struct {
	DB *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{DB: db}
}

func (r *UserRepository) GetAll() ([]models.User, error) {
	var users []models.User
	result := r.DB.Find(&users)
	return users, result.Error
}

func (r *UserRepository) GetByID(id uint) (*models.User, error) {
	var user models.User
	result := r.DB.Preload("Group").First(&user, id)
	return &user, result.Error
}

func (r *UserRepository) GetByUsername(username string) (*models.User, error) {
	var user models.User
	result := r.DB.Where("username = ?", username).First(&user)
	return &user, result.Error
}

func (r *UserRepository) GetSuperAdmin() (*models.User, error) {
	var user models.User
	result := r.DB.Model(&models.User{}).Where("role = ?", models.RoleSuperAdmin).First(&user)
	return &user, result.Error
}

func (r *UserRepository) GetByIDWithCompletedDeadlines(id uint) (*models.User, error) {
	var user models.User
	result := r.DB.Preload("CompletedDeadlines").First(&user, id)
	return &user, result.Error
}

func (r *UserRepository) Create(user *models.User) error {
	return r.DB.Create(user).Error
}

func (r *UserRepository) Update(user *models.User) error {
	return r.DB.Save(user).Error
}

func (r *UserRepository) Delete(id uint) error {
	return r.DB.Delete(&models.User{}, id).Error
}

func (r *UserRepository) MarkDeadlineCompleted(user *models.User, deadline *models.Deadline) error {
	return r.DB.Model(user).Association("CompletedDeadlines").Append(deadline)
}

func (r *UserRepository) MarkDeadlineIncomplete(user *models.User, deadline *models.Deadline) error {
	return r.DB.Model(user).Association("CompletedDeadlines").Delete(deadline)
}

func (r *UserRepository) GetByGroupID(groupID uint) ([]models.User, error) {
	var users []models.User
	result := r.DB.Where("group_id = ?", groupID).Find(&users)
	return users, result.Error
}

func (r *UserRepository) LeaveGroup(userID uint) error {
	return r.DB.Model(&models.User{}).Where("id = ?", userID).Update("group_id", nil).Error
}
