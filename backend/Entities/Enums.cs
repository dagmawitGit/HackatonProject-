namespace EkubCircle.Api.Entities;

public enum UserRole
{
    Member = 0,
    Organizer = 1,
    Admin = 2
}

public enum UserStatus
{
    Active = 0,
    Suspended = 1
}

public enum CircleStatus
{
    Forming = 0,
    Active = 1,
    Completed = 2
}

public enum RoundStatus
{
    Pending = 0,
    Open = 1,
    PaidOut = 2
}

public enum PaymentStatus
{
    Recorded = 0
}
