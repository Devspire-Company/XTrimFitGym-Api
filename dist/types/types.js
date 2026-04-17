export var ClassEnrollmentStatus;
(function (ClassEnrollmentStatus) {
    ClassEnrollmentStatus["Accepted"] = "accepted";
    ClassEnrollmentStatus["Declined"] = "declined";
    ClassEnrollmentStatus["Invited"] = "invited";
    ClassEnrollmentStatus["Pending"] = "pending";
    ClassEnrollmentStatus["Rejected"] = "rejected";
})(ClassEnrollmentStatus || (ClassEnrollmentStatus = {}));
export var CoachRequestStatus;
(function (CoachRequestStatus) {
    CoachRequestStatus["Approved"] = "approved";
    CoachRequestStatus["Denied"] = "denied";
    CoachRequestStatus["Pending"] = "pending";
})(CoachRequestStatus || (CoachRequestStatus = {}));
export var DurationType;
(function (DurationType) {
    /** Fixed calendar-day promos (plan `monthDuration` = number of days). */
    DurationType["Daily"] = "DAILY";
    DurationType["Monthly"] = "MONTHLY";
    DurationType["Quarterly"] = "QUARTERLY";
    DurationType["Yearly"] = "YEARLY";
})(DurationType || (DurationType = {}));
export var EquipmentStatus;
(function (EquipmentStatus) {
    EquipmentStatus["Available"] = "AVAILABLE";
    EquipmentStatus["Damaged"] = "DAMAGED";
    EquipmentStatus["Undermaintenance"] = "UNDERMAINTENANCE";
})(EquipmentStatus || (EquipmentStatus = {}));
export var GoalStatus;
(function (GoalStatus) {
    GoalStatus["Active"] = "active";
    GoalStatus["Cancelled"] = "cancelled";
    GoalStatus["Completed"] = "completed";
    GoalStatus["Paused"] = "paused";
})(GoalStatus || (GoalStatus = {}));
export var MembershipStatus;
(function (MembershipStatus) {
    MembershipStatus["Active"] = "ACTIVE";
    MembershipStatus["ComingSoon"] = "COMING_SOON";
    MembershipStatus["Inactive"] = "INACTIVE";
})(MembershipStatus || (MembershipStatus = {}));
export var NotificationType;
(function (NotificationType) {
    NotificationType["Inactivity"] = "INACTIVITY";
    NotificationType["MembershipExpiring"] = "MEMBERSHIP_EXPIRING";
})(NotificationType || (NotificationType = {}));
export var ProgressVerdict;
(function (ProgressVerdict) {
    ProgressVerdict["Achieved"] = "achieved";
    ProgressVerdict["CloseToAchievement"] = "close_to_achievement";
    ProgressVerdict["Progressive"] = "progressive";
    ProgressVerdict["Regressing"] = "regressing";
})(ProgressVerdict || (ProgressVerdict = {}));
export var ReportType;
(function (ReportType) {
    ReportType["Attendance"] = "ATTENDANCE";
    ReportType["Equipment"] = "EQUIPMENT";
    ReportType["NearEndingMemberships"] = "NEAR_ENDING_MEMBERSHIPS";
    ReportType["Revenue"] = "REVENUE";
    ReportType["WalkIn"] = "WALK_IN";
})(ReportType || (ReportType = {}));
export var RoleType;
(function (RoleType) {
    RoleType["Admin"] = "admin";
    RoleType["Coach"] = "coach";
    RoleType["Member"] = "member";
})(RoleType || (RoleType = {}));
export var SessionKind;
(function (SessionKind) {
    SessionKind["GroupClass"] = "group_class";
    SessionKind["Personal"] = "personal";
})(SessionKind || (SessionKind = {}));
export var SessionStatus;
(function (SessionStatus) {
    SessionStatus["Cancelled"] = "cancelled";
    SessionStatus["Completed"] = "completed";
    SessionStatus["Scheduled"] = "scheduled";
})(SessionStatus || (SessionStatus = {}));
export var SubscriptionRequestStatus;
(function (SubscriptionRequestStatus) {
    SubscriptionRequestStatus["Approved"] = "APPROVED";
    SubscriptionRequestStatus["Pending"] = "PENDING";
    SubscriptionRequestStatus["Rejected"] = "REJECTED";
})(SubscriptionRequestStatus || (SubscriptionRequestStatus = {}));
export var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["Active"] = "ACTIVE";
    TransactionStatus["Canceled"] = "CANCELED";
    TransactionStatus["Expired"] = "EXPIRED";
})(TransactionStatus || (TransactionStatus = {}));
export var WalkInGender;
(function (WalkInGender) {
    WalkInGender["Female"] = "FEMALE";
    WalkInGender["Male"] = "MALE";
    WalkInGender["NonBinary"] = "NON_BINARY";
    WalkInGender["PreferNotToSay"] = "PREFER_NOT_TO_SAY";
})(WalkInGender || (WalkInGender = {}));
