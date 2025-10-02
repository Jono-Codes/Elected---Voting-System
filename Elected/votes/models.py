from django.db import models
from django.contrib.auth.models import User

class Position(models.Model):
    """
    Represents a voting position, e.g., 'RCL President' or 'Mayor'.
    """
    name = models.CharField(max_length=100, unique=True)  # Ensure no duplicate positions

    def __str__(self):
        return self.name

class Candidate(models.Model):
    """
    Represents a candidate running for a position.
    """
    name = models.CharField(max_length=100)
    party = models.CharField(max_length=100, blank=True, null=True)
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='candidates')
    # NEW FIELD: Stores the file path. Images will be uploaded to 'candidates/' sub-folder.
    image = models.ImageField(upload_to='candidates/', blank=True, null=True) 

    def __str__(self):
        # Shows candidate name + position
        return f"{self.name} ({self.position.name})"

class Vote(models.Model):
    """
    Stores a vote cast by a user for a candidate.
    """
    voter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='votes')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='votes')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('voter', 'candidate')  # Prevent double voting per candidate

    def __str__(self):
        return f"{self.voter.username} voted for {self.candidate.name}"
