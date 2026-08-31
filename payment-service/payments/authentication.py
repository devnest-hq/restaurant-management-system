from django.conf import settings
from rest_framework import authentication, exceptions
from rest_framework.exceptions import AuthenticationFailed
 


class PaymentServiceAuthentication(authentication.BaseAuthentication):
    """
    Authenticates requests from the Node.js backend using a shared API key.
    The key must be sent in the 'X-Payment-Service-Key' header.
    """
    def authenticate(self, request):
        api_key = request.headers.get('X-Payment-Service-Key')

        if not api_key:
            raise AuthenticationFailed(
                'Payment service API key is required.'
            )

        if api_key != settings.PAYMENT_SERVICE_API_KEY:
            raise exceptions.AuthenticationFailed(
                'Invalid payment service API key.'
            )

        # No Django user; return (None, 'service') to mark as service auth
        return (None, 'service')

    def authenticate_header(self, request):
        return 'X-Payment-Service-Key'