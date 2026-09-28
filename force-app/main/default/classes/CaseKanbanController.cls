/**
 * Server-side support for the Case Kanban board LWC: supplies the board's columns
 * (the Status picklist, in page-layout order) and cards (Cases), and applies status
 * changes made by dragging a card between columns.
 */
public with sharing class CaseKanbanController {

    @AuraEnabled(cacheable=true)
    public static KanbanBoardData getBoardData() {
        KanbanBoardData data = new KanbanBoardData();
        data.statuses = getActiveStatusValues();
        data.cases = [
            SELECT Id, CaseNumber, Subject, Status, Priority, OwnerId, Owner.Name, CreatedDate
            FROM Case
            WITH USER_MODE
            ORDER BY CreatedDate DESC
            LIMIT 200
        ];
        return data;
    }

    @AuraEnabled
    public static void updateCaseStatus(Id caseId, String newStatus) {
        if (caseId == null || String.isBlank(newStatus)) {
            throw new AuraHandledException('A case and a target status are required.');
        }

        if (!getActiveStatusValues().contains(newStatus)) {
            throw new AuraHandledException('"' + newStatus + '" is not a valid Case status.');
        }

        List<Case> matches = [SELECT Id, Status FROM Case WHERE Id = :caseId WITH USER_MODE LIMIT 1];
        if (matches.isEmpty()) {
            throw new AuraHandledException('Case not found or not accessible.');
        }

        Case caseToUpdate = new Case(Id = caseId, Status = newStatus);
        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.UPDATABLE,
            new List<Case>{ caseToUpdate }
        );

        List<Case> updatableCases = decision.getRecords();
        if (updatableCases.isEmpty() || updatableCases[0].Status != newStatus) {
            throw new AuraHandledException('You do not have permission to change the status of this case.');
        }

        try {
            update updatableCases;
        } catch (DmlException dmlException) {
            throw new AuraHandledException('Unable to update case status: ' + dmlException.getDmlMessage(0));
        }
    }

    private static List<String> getActiveStatusValues() {
        List<String> statuses = new List<String>();
        for (Schema.PicklistEntry entry : Case.Status.getDescribe().getPicklistValues()) {
            if (entry.isActive()) {
                statuses.add(entry.getValue());
            }
        }
        return statuses;
    }

    public class KanbanBoardData {
        @AuraEnabled
        public List<String> statuses;
        @AuraEnabled
        public List<Case> cases;
    }
}
