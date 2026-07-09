from enum import Enum


class UserRole(str, Enum):
    ADMIN = "Administrator"
    BUSINESS = "Business User"
    MARKETING = "Marketing Team"
    CREATOR = "Content Creator"