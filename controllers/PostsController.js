import Controller from './Controller.js';
import Repository from '../models/repository.js';
import PostModel from '../models/post.js';

export default class PostsController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PostModel()));
    }

    post(data) {
        if (!('Creation' in data) || Number.isNaN(parseInt(data.Creation, 10))) {
            data.Creation = Date.now();
        } else {
            data.Creation = parseInt(data.Creation, 10);
        }
        super.post(data);
    }

    put(data) {
        const id = this.HttpContext.path.id;
        if (id) {
            const existing = this.repository.findByFilter(post => post.Id === id);
            if (existing && existing.length > 0) {
                data.Creation = parseInt(existing[0].Creation, 10);
            } else if (!('Creation' in data) || Number.isNaN(parseInt(data.Creation, 10))) {
                data.Creation = Date.now();
            } else {
                data.Creation = parseInt(data.Creation, 10);
            }
        }
        super.put(data);
    }

    remove(id) {
        const existing = this.repository.findByFilter(post => post.Id === id);
        if (existing && existing.length > 0) {
            this.repository.model.removeAssets(existing[0]);
        }
        super.remove(id);
    }
}
