export class EmailIsNotValid extends Error {
    constructor() {
        super()
        this.name = "EmailIsNotValid";
        this.message = "Incorrect email address";
    }
}