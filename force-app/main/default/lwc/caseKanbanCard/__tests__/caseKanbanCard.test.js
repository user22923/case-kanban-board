import { createElement } from 'lwc';
import CaseKanbanCard from 'c/caseKanbanCard';

describe('c-case-kanban-card', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders the case number, subject, priority and owner', () => {
        const element = createElement('c-case-kanban-card', { is: CaseKanbanCard });
        element.caseRecord = {
            Id: '500000000000001AAA',
            CaseNumber: '00001001',
            Subject: 'Cannot log in',
            Priority: 'High',
            Owner: { Name: 'Agent A' }
        };
        document.body.appendChild(element);

        expect(element.shadowRoot.querySelector('.case-number').textContent).toBe('00001001');
        expect(element.shadowRoot.querySelector('.subject').textContent).toBe('Cannot log in');
        expect(element.shadowRoot.querySelector('.owner').textContent).toBe('Agent A');
        expect(
            element.shadowRoot.querySelector('.priority-badge').classList.contains('priority-high')
        ).toBe(true);
    });

    it('falls back to Unassigned when there is no owner', () => {
        const element = createElement('c-case-kanban-card', { is: CaseKanbanCard });
        element.caseRecord = {
            Id: '500000000000002AAA',
            CaseNumber: '00001002',
            Subject: 'Billing question',
            Priority: 'Low'
        };
        document.body.appendChild(element);

        expect(element.shadowRoot.querySelector('.owner').textContent).toBe('Unassigned');
    });

    it('puts the case id on the drag event dataTransfer payload', () => {
        const element = createElement('c-case-kanban-card', { is: CaseKanbanCard });
        element.caseRecord = {
            Id: '500000000000001AAA',
            CaseNumber: '00001001',
            Subject: 'Cannot log in',
            Priority: 'High'
        };
        document.body.appendChild(element);

        const card = element.shadowRoot.querySelector('.kanban-card');
        const setData = jest.fn();
        const event = new CustomEvent('dragstart');
        event.dataTransfer = { setData };
        card.dispatchEvent(event);

        expect(setData).toHaveBeenCalledWith('text/plain', '500000000000001AAA');
    });
});
