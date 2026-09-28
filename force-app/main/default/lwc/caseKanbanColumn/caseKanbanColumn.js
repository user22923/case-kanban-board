import { LightningElement, api } from 'lwc';

export default class CaseKanbanColumn extends LightningElement {
    @api status;
    @api cases = [];

    isDragOver = false;

    get columnTitle() {
        return `${this.status} (${this.cases.length})`;
    }

    get columnClass() {
        return this.isDragOver ? 'kanban-column drag-over' : 'kanban-column';
    }

    handleDragOver(event) {
        event.preventDefault();
        this.isDragOver = true;
    }

    handleDragLeave() {
        this.isDragOver = false;
    }

    handleDrop(event) {
        event.preventDefault();
        this.isDragOver = false;
        const caseId = event.dataTransfer.getData('text/plain');
        if (!caseId) {
            return;
        }
        this.dispatchEvent(
            new CustomEvent('carddrop', {
                bubbles: true,
                composed: true,
                detail: { caseId, newStatus: this.status }
            })
        );
    }
}
