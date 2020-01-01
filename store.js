export default {
    state: {
        schemata: {},
        schemataLookup: {},
        rawSchemata: {},
        schemaFallback: {}
    },
    mutations: {
        schemata(state, schema) {
            state.schemata[schema.id] = schema.obj;
            if (EcArray.isArray(schema.obj)) {
                state.schemataLookup[schema.id] = {};
                for (var i = 0; i < schema.obj.length; i++) {
                    state.schemataLookup[schema.id][schema.obj[i]["@id"]] = schema.obj[i];
                }
            }
        },
        rawSchemata(state, schema) {
            state.rawSchemata[schema.id] = schema.obj;
        },
        schemaFallback(state, schema) {
            for (var i = 0; i < schema.length; i++) {
                state.schemaFallback[schema[i]["@id"]] = schema[i];
            }
        }
    },
    actions: {

    }
};
