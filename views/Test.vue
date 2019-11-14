<template>
    <div class="home">
        <button @click="hierarchy = !hierarchy">
            HIERARCHY CONTROL
        </button><br>
        <Hierarchy
            v-if="hierarchy"
            :container="frameworkActual"
            containerType="Framework"
            containerNodeProperty="competency"
            containerEdgeProperty="relation"
            nodeType="Competency"
            edgeType="Relation"
            edgeRelationProperty="relationType"
            edgeSourceProperty="source"
            edgeTargetProperty="target"
            edgeRelationLiteral="narrows"
            :repo="repo" />
        <button @click="complex = !complex">
            COMPLEX CONTROL
        </button><br>
        <Thing
            v-if="false"
            uri="https://dev.cassproject.org/api/data/schema.org.Person/0570cab193b88292f0927d4ae8b107ad" />
        <Thing
            v-if="complex"
            uri="https://dev.cassproject.org/api/data/schema.cassproject.org.0.3.Competency/309bbf99-8671-454d-bd94-67ca180029f5/1514482922014" />
        <button @click="competency = !competency">
            COMPETENCY SEARCH
        </button><br>
        <List
            v-if="competency"
            type="Competency"
            :profile="simpleProfile"
            :repo="repo" />
        <button @click="framework = !framework">
            FRAMEWORK SEARCH
        </button><br>
        <List
            v-if="framework"
            type="Framework"
            :repo="repo" />
        <button @click="person = !person">
            PERSON SEARCH
        </button><br>
        <List
            v-if="person"
            type="Person"
            :repo="repo" />
    </div>
</template>
<style scoped>
.home{
  max-width:600px;
  align-self: center;
  margin-left:calc(50vw - 300px);
  }
h1{
  font-size:2rem;
}
</style>
<script>
import List from './../components/lode/List.vue';
import Thing from './../components/lode/Thing.vue';
import Hierarchy from './../components/lode/Hierarchy.vue';

export default {
    name: 'Test',
    data: function() {
        return {
            repo: null,
            complex: false,
            competency: false,
            framework: false,
            hierarchy: false,
            person: false,
            frameworkActual: null,
            simpleProfile: {
                "http://schema.org/name": {
                    "@id": "http://schema.org/name",
                    "@type": ["http://www.w3.org/2000/01/rdf-schema#Property"],
                    "http://schema.org/domainIncludes": [
                        {"@id": "http://schema.cassproject.org/0.3/Competency"},
                        {"@id": "http://schema.cassproject.org/0.3/Level"},
                        {"@id": "http://schema.cassproject.org/0.3/RollupRule"},
                        {"@id": "http://schema.cassproject.org/0.3/Framework"}
                    ],
                    "http://schema.org/rangeIncludes": [{"@id": "http://schema.org/Text"}],
                    "http://www.w3.org/2000/01/rdf-schema#comment": [
                        {"@language": "en", "@value": "Name of the competency."},
                        {"@language": "en", "@value": "Name of the level."},
                        {"@language": "en", "@value": "Name of the competency framework."},
                        {"@language": "en", "@value": "Name of the rollup rule."}
                    ],
                    "http://www.w3.org/2000/01/rdf-schema#label": [{"@language": "en", "@value": "Competency Text"}]
                }
            }
        };
    },
    created: function() {
        this.repo = new EcRepository();
        this.repo.selectedServer = "https://dev.cassproject.org/api/";
        var me = this;
        EcRemote.getExpectingObject(window.location.href, "schema.jsonld", function(context) {
            jsonld.expand(context, function(err, expanded) {
                if (err == null) {
                    me.$store.commit('schemaFallback', expanded[0]["@graph"]);
                } else {
                    console.error(err);
                }
            });
        }, console.error);
        EcRemote.getExpectingObject(window.location.href, "ctdl.json", function(context) {
            jsonld.expand(context, function(err, expanded) {
                if (err == null) {
                    me.$store.commit('schemaFallback', expanded);
                } else {
                    console.error(err);
                }
            });
        }, console.error);
        EcRemote.getExpectingObject(window.location.href, "ctdlasn.json", function(context) {
            jsonld.expand(context, function(err, expanded) {
                if (err == null) {
                    me.$store.commit('schemaFallback', expanded);
                } else {
                    console.error(err);
                }
            });
        }, console.error);
        this.frameworkActual = EcFramework.getBlocking("https://dev.cassproject.org/api/data/schema.cassproject.org.0.3.Framework/d1d3f8a5-9687-4e48-92f9-3b0138be66aa");
    },
    components: {
        List, Thing, Hierarchy
    }
};
</script>
