const {print} = require('graphql');
const got = require('got');
const { fetch, AbortController } = require('@whatwg-node/fetch');
const { createClient } = require('graphql-sse');

//inspired by https://github.com/gmac/schema-stitching-handbook/blob/main/combining-local-and-remote-schemas/lib/make_remote_executor.js 
//Common extensions to got.
const client = got.extend({
    retry: {
        limit: 0
    },
    headers: {
        'Content-Type': 'application/json'
    },
    responseType: 'json',
});


module.exports = function makeRemoteExecutor(url, subscriptionUrl, {timeout = 500} = {}) {
    const clientInstance = client.extend({
        url: url,
        timeout: {
            request: timeout
        }
    });

    const subscriptionClient = createClient({
        url: subscriptionUrl,
        fetchFn: fetch,
        abortControllerImpl: AbortController,
        headers: () => {
            //let {headers} =  reqCtxt.get("subscriptionCtxt"); getting headers from cls-hooked for auth etc.
            let headers = {};
            return headers;
        }
    });

    return async ({document, context, variables, operationType}) => {
        const query = typeof document === 'string' ? document : print(document);
        if(operationType !== 'subscription'){
            let {body} = await clientInstance.post({
                headers: context?.headers,
                json: {query, variables}
            });
            return body;
        } else {

            const request = {
                query: print(document),
                variables: variables
            }

            let deferred = null;
            const pending = [];
            let throwMe = null,
                done = false;
            const dispose = subscriptionClient.subscribe(request, {
                next: (data) => {
                    pending.push(data);
                    deferred?.resolve(false);
                },
                error: (err) => {
                    throwMe = err;
                    deferred?.reject(throwMe);
                },
                complete: () => {
                    done = true;
                    deferred?.resolve(true);
                },
            });
            return {
                [Symbol.asyncIterator]() {
                    return this;
                },
                async next() {
                    if (done) return {done: true, value: undefined};
                    if (throwMe) throw throwMe;
                    if (pending.length) return {value: pending.shift()};
                    return (await new Promise((resolve, reject) => (
                            deferred = {resolve, reject}))
                    )
                        ? {done: true, value: undefined}
                        : {value: pending.shift()};
                },
                async throw(err) {
                    throw err;
                },
                async return() {
                    dispose();
                    return {done: true, value: undefined};
                }
            };


        }
    };
};


