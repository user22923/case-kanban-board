import { createElement } from 'lwc';
import CaseKanbanColumn from 'c/caseKanbanColumn';

describe('c-case-kanban-column', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('displays the status and case count in the header', () => {
        const element = createElement('c-case-kanban-column', { is: CaseKanbanColumn });
        element.status = 'New';
        element.cases = [{ Id: '1' }, { Id: '2' }];
        document.body.appendChild(element);

        const header = element.shadowRoot.querySelector('.column-header');
        expect(header.textContent).toBe('New (2)');
    });

    it('shows an empty state when there are no cases', () => {
        const element = createElement('c-case-kanban-column', { is: CaseKanbanColumn });
        element.status = 'Closed';
        element.cases = [];
        document.body.appendChild(element);

        expect(element.shadowRoot.querySelector('.empty-column')).not.toBeNull();
    });

    it('dispatches carddrop with the dropped case id and this column status', () => {
        const element = createElement('c-case-kanban-column', { is: CaseKanbanColumn });
        element.status = 'Working';
        element.cases = [];
        document.body.appendChild(element);

        const handler = jest.fn();
        element.addEventListener('carddrop', handler);

        const dropTarget = element.shadowRoot.querySelector('.kanban-column');
        const event = new CustomEvent('drop');
        event.dataTransfer = { getData: jest.fn().mockReturnValue('500000000000001AAA') };
        dropTarget.dispatchEvent(event);

        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail).toEqual({
            caseId: '500000000000001AAA',
            newStatus: 'Working'
        });
    });
});
