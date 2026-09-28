import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getBoardData from '@salesforce/apex/CaseKanbanController.getBoardData';
import updateCaseStatus from '@salesforce/apex/CaseKanbanController.updateCaseStatus';

export default class CaseKanbanBoard extends LightningElement {
    statuses = [];
    cases = [];
    isLoading = true;
    errorMessage;

    wiredBoardResult;

    @wire(getBoardData)
    wiredBoard(result) {
        this.wiredBoardResult = result;
        this.isLoading = false;
        if (result.data) {
            this.statuses = result.data.statuses;
            this.cases = result.data.cases;
            this.errorMessage = undefined;
        } else if (result.error) {
            this.errorMessage = this.extractErrorMessage(result.error);
        }
    }

    get columns() {
        return this.statuses.map((status) => ({
            status,
            cases: this.cases.filter((caseRecord) => caseRecord.Status === status)
        }));
    }

    get hasError() {
        return Boolean(this.errorMessage);
    }

    async handleCardDrop(event) {
        const { caseId, newStatus } = event.detail;
        const caseToMove = this.cases.find((caseRecord) => caseRecord.Id === caseId);
        if (!caseToMove || caseToMove.Status === newStatus) {
            return;
        }

        const previousStatus = caseToMove.Status;
        this.moveCardLocally(caseId, newStatus);

        try {
            await updateCaseStatus({ caseId, newStatus });
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Case updated',
                    message: `${caseToMove.CaseNumber} moved to ${newStatus}.`,
                    variant: 'success'
                })
            );
            await refreshApex(this.wiredBoardResult);
        } catch (error) {
            this.moveCardLocally(caseId, previousStatus);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Unable to update case',
                    message: this.extractErrorMessage(error),
                    variant: 'error'
                })
            );
        }
    }

    moveCardLocally(caseId, status) {
        this.cases = this.cases.map((caseRecord) =>
            caseRecord.Id === caseId ? { ...caseRecord, Status: status } : caseRecord
        );
    }

    extractErrorMessage(error) {
        return error?.body?.message || error?.message || 'An unknown error occurred.';
    }
}
