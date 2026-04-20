from rest_framework import serializers
from .models import StudentProfile

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = '__all__'
        read_only_fields = ('user', 'profile_completeness')

    def create(self, validated_data):
        user = self.context['request'].user
        profile, created = StudentProfile.objects.update_or_create(
            user=user,
            defaults=validated_data
        )
        return profile
