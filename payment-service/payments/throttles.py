from rest_framework.throttling import SimpleRateThrottle    

class PaymentCreationRateThrottle(SimpleRateThrottle):
    scope = 'payment_creation'
    rate = '10/min'

    def get_cache_key(self, request, view):
        return self.get_ident(request)              


class PaymentStatusRateThrottle(SimpleRateThrottle):
    scope = 'payment_status'
    rate = '20/min'

    def get_cache_key(self, request, view):
        return self.get_ident(request)    

class RefundRateThrottle(SimpleRateThrottle):
    scope = 'refund'
    rate = '5/min'

    def get_cache_key(self, request, view):
        return self.get_ident(request)    