import { createElement } from 'lwc';
import { registerApexTestWireAdapter } from '@salesforce/sfdx-lwc-jest';
import CaseKanbanBoard from 'c/caseKanbanBoard';
import getBoardData from '@salesforce/apex/CaseKanbanController.getBoardData';
import updateCaseStatus from '@salesforce/apex/CaseKanbanController.updateCaseStatus';
import { refreshApex } from '@salesforce/apex';

jest.mock(
    '@salesforce/apex/CaseKanbanController.updateCaseStatus',
    () => ({ default: jest.fn() }),
    { virtual: true }
);
jest.mock('@salesforce/apex', () => ({ refreshApex: jest.fn() }), { virtual: true });

const getBoardDataAdapter = registerApexTestWireAdapter(getBoardData);

const BOARD_DATA = {
    statuses: ['New', 'Working', 'Closed'],
    cases: [
        {
            Id: '500000000000001AAA',
            CaseNumber: '00001001',
            Subject: 'Cannot log in',
            Status: 'New',
            Priority: 'High',
            Owner: { Name: 'Agent A' }
        },
        {
            Id: '500000000000002AAA',
            CaseNumber: '00001002',
            Subject: 'Billing question',
            Status: 'Working',
            Priority: 'Medium',
            Owner: { Name: 'Agent B' }
        }
    ]
};

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('c-case-kanban-board', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('renders one column per status, populated with the matching cases', async () => {
        const element = createElement('c-case-kanban-board', { is: CaseKanbanBoard });
        document.body.appendChild(element);

        getBoardDataAdapter.emit(BOARD_DATA);
        await flushPromises();

        const columns = element.shadowRoot.querySelectorAll('c-case-kanban-column');
        expect(columns.length).toBe(3);
        expect(columns[0].status).toBe('New');
        expect(columns[0].cases).toHaveLength(1);
        expect(columns[1].status).toBe('Working');
        expect(columns[1].cases).toHaveLength(1);
        expect(columns[2].status).toBe('Closed');
        expect(columns[2].cases).toHaveLength(0);
    });

    it('shows an error message when the wire adapter errors out', async () => {
        const element = createElement('c-case-kanban-board', { is: CaseKanbanBoard });
        document.body.appendChild(element);

        getBoardDataAdapter.error({ message: 'No access' });
        await flushPromises();

        const errorDiv = element.shadowRoot.querySelector('.slds-text-color_error');
        expect(errorDiv.textContent).toBe('No access');
    });

    it('moves a case to a new status and refreshes the board when the drop succeeds', async () => {
        updateCaseStatus.mockResolvedValue();
        refreshApex.mockResolvedValue();

        const element = createElement('c-case-kanban-board', { is: CaseKanbanBoard });
        document.body.appendChild(element);
        getBoardDataAdapter.emit(BOARD_DATA);
        await flushPromises();

        const workingColumn = element.shadowRoot.querySelectorAll('c-case-kanban-column')[1];
        workingColumn.dispatchEvent(
            new CustomEvent('carddrop', {
                detail: { caseId: '500000000000001AAA', newStatus: 'Working' }
            })
        );
        await flushPromises();

        expect(updateCaseStatus).toHaveBeenCalledWith({
            caseId: '500000000000001AAA',
            newStatus: 'Working'
        });
        expect(refreshApex).toHaveBeenCalled();

        const columns = element.shadowRoot.querySelectorAll('c-case-kanban-column');
        expect(columns[0].cases).toHaveLength(0);
        expect(columns[1].cases).toHaveLength(2);
    });

    it('rolls back the optimistic move when the server call fails', async () => {
        updateCaseStatus.mockRejectedValue({ body: { message: 'Not allowed' } });

        const element = createElement('c-case-kanban-board', { is: CaseKanbanBoard });
        document.body.appendChild(element);
        getBoardDataAdapter.emit(BOARD_DATA);
        await flushPromises();

        const workingColumn = element.shadowRoot.querySelectorAll('c-case-kanban-column')[1];
        workingColumn.dispatchEvent(
            new CustomEvent('carddrop', {
                detail: { caseId: '500000000000001AAA', newStatus: 'Working' }
            })
        );
        await flushPromises();
        await flushPromises();

        const columns = element.shadowRoot.querySelectorAll('c-case-kanban-column');
        expect(columns[0].cases).toHaveLength(1);
        expect(columns[1].cases).toHaveLength(1);
    });
});
