import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class CaseKanbanCard extends NavigationMixin(LightningElement) {
    @api caseRecord;

    get ownerName() {
        return this.caseRecord?.Owner?.Name ?? 'Unassigned';
    }

    get priorityClass() {
        const priority = this.caseRecord?.Priority;
        if (priority === 'High' || priority === 'Urgent') {
            return 'priority-badge priority-high';
        }
        if (priority === 'Medium') {
            return 'priority-badge priority-medium';
        }
        return 'priority-badge priority-low';
    }

    handleDragStart(event) {
        event.dataTransfer.setData('text/plain', this.caseRecord.Id);
        event.dataTransfer.effectAllowed = 'move';
    }

    handleOpenRecord() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.caseRecord.Id,
                objectApiName: 'Case',
                actionName: 'view'
            }
        });
    }
}
