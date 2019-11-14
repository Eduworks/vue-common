<template>
    <span>
        <input
            ref="language"
            v-if="computedLanguage"
            v-model="computedLanguage"
            @blur="blur">
        <textarea
            ref="text"
            v-model="computedText"
            @blur="blur" />
    </span>
</template>

<script>
export default {
    name: 'PropertyString',
    props: {
        thing: Object,
        expandedThing: Object,
        property: String,
        expandedProperty: String,
        schema: Object,
        index: null
    },
    created: function() {
    },
    data: function() {
        var property = this.thing[this.property];
        if (EcArray.isArray(property)) {
            return {
                text: this.thing[this.property][this.index],
                indexInternal: this.index
            };
        } else {
            return {
                text: this.thing[this.property],
                indexInternal: null
            };
        }
    },
    computed: {
        computedText: {
            get: function() {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@value"] === undefined) {
                        return null;
                    }
                    return this.text["@value"];
                }
                return this.text;
            },
            set: function(value) {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@value"] !== undefined) {
                        this.text["@value"] = value;
                    }
                } else {
                    this.text = value;
                }
            }
        },
        computedLanguage: {
            get: function() {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@language"] === undefined) {
                        return null;
                    }
                    return this.text["@language"];
                }
                return null;
            },
            set: function(value) {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@language"] !== undefined) {
                        this.text["@language"] = value;
                    }
                }
            }
        }
    },
    watch: {
        text: function(newValue, oldValue) {
        }
    },
    methods: {
        blur: function() {
            this.$parent.update(this.text, this.indexInternal);
        }
    }
};
</script>