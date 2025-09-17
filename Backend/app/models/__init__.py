# Models module for EasyRent API

from .listing import *
from .agency import *
from .auth import *
from .media import *
from .interactions import *
from .subscription import *
from .analytics import *
from .verification import *
from .notification import *
from .admin import *
from .integration import *
from .webhook import *
from .api_key import *

# Set up relationships to avoid circular imports
from sqlalchemy.orm import relationship

# Webhook relationships
User.webhooks = relationship("Webhook", back_populates="user", cascade="all, delete-orphan")

# API Key relationships
User.api_keys = relationship("ApiKey", foreign_keys="ApiKey.user_id", back_populates="user", cascade="all, delete-orphan")
User.developer_applications = relationship("DeveloperApplication", back_populates="user", cascade="all, delete-orphan")
