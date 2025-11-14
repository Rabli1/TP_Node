class Posts_API {
    static API_URL() { return `https://tpnode.azurewebsites.net/api/Posts`; }

    static currentETag = "";
    static holdPeriodicRefresh = false;
    static periodicRefreshPeriod = 3; // seconds

    static initHttpState() {
        this.currentHttpError = "";
        this.currentStatus = 0;
        this.error = false;
    }

    static setHttpErrorState(xhr) {
        if (xhr && xhr.responseJSON && xhr.responseJSON.error_description) {
            this.currentHttpError = xhr.responseJSON.error_description;
        } else if (xhr) {
            this.currentHttpError = xhr.statusText === "error" ? "Service introuvable" : xhr.statusText;
        } else {
            this.currentHttpError = "Erreur inconnue";
        }
        this.currentStatus = xhr ? xhr.status : 0;
        this.error = true;
    }

    static start_Periodic_Refresh(callback) {
        const trigger = async () => {
            await callback();
        };
        trigger();
        setInterval(async () => {
            if (!this.holdPeriodicRefresh) {
                const etag = await this.HEAD();
                if (etag) {
                    if (this.currentETag && etag !== this.currentETag) {
                        await callback();
                    } else if (!this.currentETag) {
                        this.currentETag = etag;
                    }
                }
            }
        }, this.periodicRefreshPeriod * 1000);
    }

    static stop_Periodic_Refresh() {
        this.holdPeriodicRefresh = true;
    }

    static resume_Periodic_Refresh() {
        this.holdPeriodicRefresh = false;
    }

    static async HEAD() {
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL(),
                type: "HEAD",
                contentType: "text/plain",
                success: (_, __, xhr) => { resolve(xhr.getResponseHeader("ETag")); },
                error: xhr => { this.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    static async Get(resource = "") {
        this.initHttpState();
        let url = this.API_URL();
        if (typeof resource === "string" && resource.length > 0) {
            if (resource.startsWith("?")) url += resource;
            else if (resource.startsWith("/")) url += resource;
            else url += `/${resource}`;
        }
        return new Promise(resolve => {
            $.ajax({
                url,
                complete: data => {
                    this.currentETag = data.getResponseHeader("ETag") ?? this.currentETag;
                    resolve({ ETag: this.currentETag, data: data.responseJSON });
                },
                error: xhr => { this.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    static async Save(post, create = true) {
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: create ? this.API_URL() : `${this.API_URL()}/${post.Id}`,
                type: create ? "POST" : "PUT",
                contentType: "application/json",
                data: JSON.stringify(post),
                success: data => { resolve(data); },
                error: xhr => { this.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }

    static async Delete(id) {
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: `${this.API_URL()}/${id}`,
                type: "DELETE",
                success: () => { resolve(true); },
                error: xhr => { this.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
}
