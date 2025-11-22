export class SimonGame {
    overlay: HTMLDivElement;
    msgDisplay: HTMLDivElement;
    buttons: HTMLButtonElement[] = [];
    
    sequence: number[] = [];
    playerStep: number = 0;
    isInputBlocked: boolean = false;
    
    colors = ['red', 'blue', 'green'];
    targetColor: string = '';
    
    onWin: (color: string) => void;
    onClose: () => void;

    constructor(onWin: (color: string) => void, onClose: () => void) {
        this.onWin = onWin;
        this.onClose = onClose;
        
        // Create UI
        this.overlay = document.createElement('div');
        this.overlay.id = 'minigame-overlay';
        
        this.msgDisplay = document.createElement('div');
        this.msgDisplay.id = 'game-msg';
        this.overlay.appendChild(this.msgDisplay);

        const btnContainer = document.createElement('div');
        btnContainer.className = 'simon-buttons';
        
        this.colors.forEach((color, index) => {
            const btn = document.createElement('button');
            btn.className = `simon-btn`;
            btn.style.backgroundColor = color;
            btn.onclick = () => this.handleInput(index);
            this.buttons.push(btn);
            btnContainer.appendChild(btn);
        });
        this.overlay.appendChild(btnContainer);

        const closeBtn = document.createElement('button');
        closeBtn.id = 'close-btn';
        closeBtn.innerText = 'Give Up (Close)';
        closeBtn.onclick = () => this.hide();
        this.overlay.appendChild(closeBtn);

        document.body.appendChild(this.overlay);
    }

    show(rewardColor: string) {
        this.targetColor = rewardColor;
        this.overlay.style.display = 'flex';
        this.msgDisplay.innerText = "Watch the sequence...";
        this.startGame();
    }

    hide() {
        this.overlay.style.display = 'none';
        this.onClose(); // Re-enable 3D controls
    }

    startGame() {
        this.sequence = [];
        this.playerStep = 0;
        this.nextRound();
    }

    nextRound() {
        this.playerStep = 0;
        this.isInputBlocked = true;
        
        // Generate random sequence length 3~5
        const length = 3; 
        this.sequence = [];
        for(let i=0; i<length; i++) {
            this.sequence.push(Math.floor(Math.random() * 3));
        }

        this.playSequence();
    }

    playSequence() {
        let i = 0;
        const interval = setInterval(() => {
            if (i >= this.sequence.length) {
                clearInterval(interval);
                this.isInputBlocked = false;
                this.msgDisplay.innerText = "Your Turn!";
                return;
            }
            this.flashButton(this.sequence[i]);
            i++;
        }, 600); // Speed
    }

    flashButton(index: number) {
        const btn = this.buttons[index];
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 300);
    }

    handleInput(index: number) {
        if (this.isInputBlocked) return;

        this.flashButton(index);

        if (index !== this.sequence[this.playerStep]) {
            this.msgDisplay.innerText = "Wrong! Try Again.";
            this.isInputBlocked = true;
            setTimeout(() => this.startGame(), 500); // Quick restart on fail
            return;
        }

        this.playerStep++;

        if (this.playerStep >= this.sequence.length) {
            // Instant win & close
            this.onWin(this.targetColor);
            this.hide();
        }
    }
}