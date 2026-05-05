from .models import PlacementActivity


def log_activity(*, activity_type, title, message='', actor=None, application=None, placement=None):
    return PlacementActivity.objects.create(
        activity_type=activity_type,
        title=title,
        message=message,
        actor=actor,
        application=application,
        placement=placement,
    )
