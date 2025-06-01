from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage

if not settings.USE_S3:
    from django.core.files.storage import FileSystemStorage

    class PrivateMediaStorage(FileSystemStorage):
        """
        Local storage for private media (for development only).
        """

    class PublicMediaStorage(FileSystemStorage):
        """
        Local storage for public media (for development only).
        """

    class PublicStaticStorage(FileSystemStorage):
        """
        Local storage for public static files (for development only).
        """
else:

    class PrivateMediaStorage(S3Boto3Storage):
        location = "media"
        default_acl = None  # Disable ACLs
        file_overwrite = getattr(settings, "AWS_S3_FILE_OVERWRITE", False)
        custom_domain = settings.AWS_S3_CUSTOM_DOMAIN
        querystring_auth = True  # For signed URLs

    class PublicMediaStorage(S3Boto3Storage):
        location = "media"
        default_acl = None  # Disable ACLs
        file_overwrite = getattr(settings, "AWS_S3_FILE_OVERWRITE", False)
        custom_domain = settings.AWS_S3_CUSTOM_DOMAIN
        querystring_auth = False  # No signed URLs, direct access
        # Note: Ensure that your bucket policy allows public access to the media files
        # and that the files are set to public-read when uploaded.

    class PublicStaticStorage(S3Boto3Storage):
        location = "static"
        default_acl = None  # Disable ACLs
        file_overwrite = getattr(settings, "AWS_S3_FILE_OVERWRITE", True)
        custom_domain = settings.AWS_S3_CUSTOM_DOMAIN
        querystring_auth = False
