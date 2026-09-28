@isTest
private class CaseKanbanControllerTest {

    @TestSetup
    static void setup() {
        insert new List<Case>{
            new Case(Subject = 'Cannot log in', Status = 'New', Priority = 'High'),
            new Case(Subject = 'Billing question', Status = 'New', Priority = 'Medium'),
            new Case(Subject = 'Password reset', Status = 'Working', Priority = 'Low'),
            new Case(Subject = 'Data export request', Status = 'Closed', Priority = 'Medium')
        };
    }

    @isTest
    static void testGetBoardDataReturnsStatusesAndCases() {
        Test.startTest();
        CaseKanbanController.KanbanBoardData data = CaseKanbanController.getBoardData();
        Test.stopTest();

        Assert.isNotNull(data.statuses, 'Board data should include the active Status picklist values.');
        Assert.isTrue(data.statuses.contains('New'), 'The default New status should be part of the board columns.');
        Assert.areEqual(4, data.cases.size(), 'All seeded cases should come back from the board query.');
    }

    @isTest
    static void testUpdateCaseStatusMovesCard() {
        Case testCase = [SELECT Id, Status FROM Case WHERE Subject = 'Cannot log in' LIMIT 1];

        Test.startTest();
        CaseKanbanController.updateCaseStatus(testCase.Id, 'Working');
        Test.stopTest();

        Case updated = [SELECT Status FROM Case WHERE Id = :testCase.Id];
        Assert.areEqual('Working', updated.Status, 'Status should reflect the requested column move.');
    }

    @isTest
    static void testUpdateCaseStatusRejectsInvalidStatus() {
        Case testCase = [SELECT Id FROM Case WHERE Subject = 'Cannot log in' LIMIT 1];

        Boolean exceptionThrown = false;
        try {
            CaseKanbanController.updateCaseStatus(testCase.Id, 'Not A Real Status');
        } catch (AuraHandledException ahe) {
            exceptionThrown = true;
        }

        Assert.isTrue(exceptionThrown, 'An invalid status value must be rejected.');

        Case unchanged = [SELECT Status FROM Case WHERE Id = :testCase.Id];
        Assert.areEqual('New', unchanged.Status, 'The case status must not change when the update is rejected.');
    }

    @isTest
    static void testUpdateCaseStatusRejectsMissingInput() {
        Boolean exceptionThrown = false;
        try {
            CaseKanbanController.updateCaseStatus(null, 'Working');
        } catch (AuraHandledException ahe) {
            exceptionThrown = true;
        }
        Assert.isTrue(exceptionThrown, 'A null case id must be rejected before any query or DML runs.');
    }

    @isTest
    static void testUpdateCaseStatusRejectsUnknownCase() {
        Boolean exceptionThrown = false;
        try {
            CaseKanbanController.updateCaseStatus(Id.valueOf('500000000000000AAA'), 'Working');
        } catch (AuraHandledException ahe) {
            exceptionThrown = true;
        }
        Assert.isTrue(exceptionThrown, 'A case id that does not exist must be rejected.');
    }

    @isTest
    static void testRestrictedUserIsBlockedByFieldLevelSecurity() {
        Profile restrictedProfile = [SELECT Id FROM Profile WHERE Name = 'Minimum Access - Salesforce' LIMIT 1];
        User restrictedUser = new User(
            ProfileId = restrictedProfile.Id,
            LastName = 'Restricted',
            FirstName = 'Test',
            Email = 'restricted.kanban.user@example.test',
            Username = 'restricted.kanban.user.' + DateTime.now().getTime() + '@example.test.invalid',
            Alias = 'restr',
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US'
        );
        insert restrictedUser;

        Case testCase = [SELECT Id FROM Case WHERE Subject = 'Cannot log in' LIMIT 1];

        Boolean accessWasDenied = false;
        System.runAs(restrictedUser) {
            try {
                CaseKanbanController.updateCaseStatus(testCase.Id, 'Working');
            } catch (AuraHandledException ahe) {
                accessWasDenied = true;
            } catch (System.QueryException qe) {
                accessWasDenied = true;
            }
        }

        Assert.isTrue(
            accessWasDenied,
            'A user without object/field permissions on Case must be blocked by WITH USER_MODE or stripInaccessible.'
        );
    }
}
