import BasicModal from '../components/BasicModal.vue';

const Modal = {
    install(Vue, options) {
        this.EventBus = new Vue();
        Vue.component('basic-modal', BasicModal);
        Vue.prototype.$modal = {
            show(params) {
                Modal.EventBus.$emit('show', params);
            }
        };
    }
};
export default Modal;
