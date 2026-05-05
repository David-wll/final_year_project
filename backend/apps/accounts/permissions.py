from rest_framework import permissions

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        try:
            return bool(request.user and request.user.is_authenticated and str(request.user.role).lower() == 'student')
        except Exception:
            return False

class IsOrganization(permissions.BasePermission):
    def has_permission(self, request, view):
        try:
            return bool(request.user and request.user.is_authenticated and str(request.user.role).lower() == 'organization')
        except Exception:
            return False

class IsCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        try:
            return bool(request.user and request.user.is_authenticated and str(request.user.role).lower() == 'coordinator')
        except Exception:
            return False

class IsSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        try:
            return bool(request.user and request.user.is_authenticated and str(request.user.role).lower() == 'supervisor')
        except Exception:
            return False
