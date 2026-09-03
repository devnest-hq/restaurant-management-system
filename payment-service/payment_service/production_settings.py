import os
from .settings import *

#Security
DEBUG = False
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')

#HTTPS setting
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

#Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

#Database - Use Neon with connection pooling
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'payment_service_db'),
        'USER': os.getenv('DB_USER', ''),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', ''),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE':0 if 'test' in sys.argv else 600,
        'OPTIONS':{
            'sslmode': 'require',
        }
    }
}

#CORS - Restict to production frontend
CORS_ALLOWED_ORIGINS = [
    "https://production-frontend.com",
    "https://production-backend.com"
]
CORS_ALLOW_CREDENTIALS = True

#Logging - Production level
LOGGING = {
    'version':1,
    'disable_existing_loggers': False,
    'formatters':{
        'verbose':{
            'format':'{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style':'{'
        },  
    },
    'handlers':{
        'console':{
            'class':'logging.StreamHandler',
            'formatter':'verbose'
        },
        'file':{
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/payment_service/payment_service.log',
            'maxBytes': 1024*1024*10,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
       },
       'loggers': {
        'django': {
            'handlers':['console', 'file'],
            'level':'WARNING',
            'propagate':False,
        },
        'payments':{
            'handlers':['console', 'file'],
            'level':'INFO',
            'propagate':False,
        },
    },
}

#Rate limiting - Production level
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon':'50/min',
    'payment_creation':'5/min',
    'payment_status':'20/min',
    'refund':'3/min',
}