/**
 * Import BossView
 */
import BossView from "../../libs/unmanaged/bossview-es6";
import * as _ from "underscore";
import * as Template from './landing.html';

export default class LandingPage extends BossView {
    constructor(...args) {
        super(...args);
    }

    get template() {
        return _.template(Template)
    }

    onClick() {
        this.$el.html("Yes hello");
    }
}
