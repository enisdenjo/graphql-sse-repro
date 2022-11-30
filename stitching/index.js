const express = require('express');
const { graphqlHTTP, getGraphQLParams } = require('express-graphql');
const { stitchSchemas } = require('@graphql-tools/stitch');
const { stitchingDirectives } = require('@graphql-tools/stitching-directives');
const { stitchingDirectivesTransformer } = stitchingDirectives();
const { printSchema, buildSchema } = require('graphql');
const { createHandler } = require('graphql-sse');
const make_remote_executor = require('./make_remote_executor');
const executor = make_remote_executor('http://localhost:4100/graphql', 'http://localhost:4100/subscriptions');


async function loadSchema() {
    return await fetchRemoteSDL(executor);
}

//Custom directives are needed at the stitching layer and hence get schema this way.
async function fetchRemoteSDL(executor) {
    const result = await executor({ document: '{ _sdl }' });
    return result.data._sdl;
}

async function createStitchedSchema() {
    let subschemas = [
        {
            schema: buildSchema(await loadSchema()),
            executor: executor,
        }];

    return stitchSchemas({
        subschemaConfigTransforms: [stitchingDirectivesTransformer],
        subschemas: subschemas,
        typeMergingOptions: {
            validationLevel: 'error'
        },
        typeDefs: 'type Query { heartbeat: String! }',
        resolvers: {
            Query: {
                'heartbeat': () => 'OK',
            }
        }
    });
}

function createGraphQLOptions(stitchedSchema) {
    return async (req, res, params) => {
        // identify headers to pass through to sub-schema queries
        let headers = {}
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization
        }
        if (req.get('Accept-Language')) {
            headers['Accept-Language'] = req.get('Accept-Language')
        }

        return {
            schema: stitchedSchema,
            context: {
                headers: headers
            },
            graphiql: {
                headerEditorEnabled: true
            }
        }
    };
}



(async () => {
    var stitchedSchema = await createStitchedSchema();
    const app = express();
    app.use(express.json());
    app.use('/graphql', graphqlHTTP(createGraphQLOptions(stitchedSchema)));
    let handler = createHandler({
        schema: stitchedSchema,
        context: async (req, args) => {
            let subscriptionCtxt = {};
            subscriptionCtxt.headers = {};
            subscriptionCtxt.headers['Authorization'] = req.headers?.authorization;
            subscriptionCtxt.headers['Accept-Language'] = req.headers?.['accept-language'];
            //set it to a context using cls-hooked as well.
            return subscriptionCtxt;
        }
    })
    app.use('/subscriptions',handler);
    let server = app.listen(4200, () => console.info('gateway running http://localhost:4200/ensemble/graphql'));
})();


process
    .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise', p);
    })
    .on('uncaughtException', err => {
        console.error(err, 'Uncaught Exception thrown');
    });


