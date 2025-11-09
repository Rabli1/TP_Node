import Model from './model.js';

export default class Post extends Model {
    constructor() {
        super(true /* secured Id */);

        this.addField('Title', 'stringNotEmpty');
        this.addField('Text', 'stringNotEmpty');
        this.addField('Category', 'stringNotEmpty');
        this.addField('Image', 'asset');
        this.addField('Creation', 'integer');

        this.setKey('Title');
    }
}
