// src/Inventory.ts
export class Inventory {
    container: HTMLDivElement;
    slots: HTMLElement[] = [];

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'inventory-bar';
        document.body.appendChild(this.container);

        // Create 3 slots
        for (let i = 0; i < 3; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            this.container.appendChild(slot);
            this.slots.push(slot);
        }
    }

    addItem(color: string) {
        // Find empty slot
        const emptySlot = this.slots.find(slot => slot.childElementCount === 0);
        
        if (emptySlot) {
            const item = document.createElement('div');
            item.className = 'inv-item';
            item.style.backgroundColor = color;
            emptySlot.appendChild(item);
            return true;
        }
        return false; // Inventory full
    }

    hasItem(color: string): boolean {
        return this.slots.some(slot => {
            const item = slot.firstElementChild as HTMLElement;
            return item && item.style.backgroundColor === color;
        });
    }
}