/* @flow */

import React, { Component, PropTypes } from "react";
import ReactDOM from "react-dom";

import { formatValue } from "metabase/lib/formatting";
import { isNumeric } from "metabase/lib/schema_metadata";
import Icon from "metabase/components/Icon.jsx";
import IconBorder from "metabase/components/IconBorder.jsx";
import { normal } from "metabase/lib/colors";

import Color from "color";
import cx from "classnames";

const BORDER_RADIUS = 5;
const MAX_BAR_HEIGHT = 65;

import type { VisualizationProps } from "metabase/visualizations";

export default class Progress extends Component<*, VisualizationProps, *> {
    static uiName = "Progress";
    static identifier = "progress";
    static iconName = "progress";

    static minSize = { width: 3, height: 3 };

    static isSensible(cols, rows) {
        return rows.length === 1 && cols.length === 1;
    }

    static checkRenderable([{ data: { cols, rows} }]) {
        if (!isNumeric(cols[0])) {
            throw new Error("Progress visualization requires a number.");
        }
    }

    static settings = {
        "progress.goal": {
            section: "Display",
            title: "Goal",
            widget: "number",
            default: 0
        },
        "progress.color": {
            section: "Display",
            title: "Color",
            widget: "color",
            default: normal.green
        },
    }

    componentDidMount() {
        this.componentDidUpdate();
    }

    componentDidUpdate() {
        const component = ReactDOM.findDOMNode(this);
        const pointer = ReactDOM.findDOMNode(this.refs.pointer);
        const label = ReactDOM.findDOMNode(this.refs.label);
        const container = ReactDOM.findDOMNode(this.refs.container);
        const bar = ReactDOM.findDOMNode(this.refs.bar);

        // Safari not respecting `height: 25%` so just do it here ¯\_(ツ)_/¯
        bar.style.height = Math.min(MAX_BAR_HEIGHT, component.offsetHeight) + "px";

        if (this.props.gridSize && this.props.gridSize.height < 4) {
            pointer.parentNode.style.display = "none";
            label.parentNode.style.display = "none";
            // no need to do the rest of the repositioning
            return;
        } else {
            pointer.parentNode.style.display = null;
            label.parentNode.style.display = null;
        }

        // reset the pointer transform for these computations
        pointer.style.transform = null;

        // position the label
        const containerWidth = container.offsetWidth;
        const labelWidth = label.offsetWidth;
        const pointerWidth = pointer.offsetWidth;
        const pointerCenter = pointer.offsetLeft + pointerWidth / 2;
        const minOffset = (-pointerWidth / 2) + BORDER_RADIUS
        if (pointerCenter - labelWidth / 2 < minOffset) {
            label.style.left = minOffset + "px";
            label.style.right = null
        } else if (pointerCenter + labelWidth / 2 > containerWidth - minOffset) {
            label.style.left = null
            label.style.right = minOffset + "px";
        } else {
            label.style.left = (pointerCenter - labelWidth / 2) + "px";
            label.style.right = null;
        }

        // shift pointer at ends inward to line up with border radius
        if (pointerCenter < BORDER_RADIUS) {
            pointer.style.transform = "translate(" + BORDER_RADIUS + "px,0)";
        } else if (pointerCenter > containerWidth - 5) {
            pointer.style.transform = "translate(-" + BORDER_RADIUS + "px,0)";
        }
    }

    render() {
        const { series: [{ data: { rows } }], settings } = this.props;
        const value: number = rows[0][0];
        const goal = settings["progress.goal"] || 0;

        const mainColor = settings["progress.color"];
        const lightColor = Color(mainColor).lighten(0.25).rgb().string();
        const darkColor = Color(mainColor).darken(0.30).rgb().string();

        const progressColor = mainColor;
        const restColor = value > goal ? darkColor : lightColor;
        const arrowColor = value > goal ? darkColor : mainColor;

        const barPercent = Math.max(0, value < goal ? value / goal : goal / value);
        const arrowPercent = Math.max(0, value < goal ? value / goal : 1);

        let barMessage;
        if (value === goal) {
            barMessage = "Goal met";
        } else if (value > goal) {
            barMessage = "Goal exceeded";
        }

        return (
            <div className={cx(this.props.className, "flex layout-centered")}>
                <div className="flex-full full-height flex flex-column justify-center" style={{ padding: 10, paddingTop: 0 }}>
                    <div
                        ref="container"
                        className="relative text-bold text-grey-4"
                        style={{ height: 20 }}
                    >
                        <div
                            ref="label"
                            style={{ position: "absolute" }}
                        >
                            {formatValue(value, { comma: true })}
                        </div>
                    </div>
                    <div className="relative" style={{ height: 10, marginBottom: 5 }}>
                        <div
                            ref="pointer"
                            style={{
                                width: 0,
                                height: 0,
                                position: "absolute",
                                left: (arrowPercent * 100) + "%",
                                marginLeft: -10,
                                borderLeft: "10px solid transparent",
                                borderRight: "10px solid transparent",
                                borderTop: "10px solid " + arrowColor
                            }}
                        />
                    </div>
                    <div ref="bar" className="relative" style={{
                        backgroundColor: restColor,
                        borderRadius: BORDER_RADIUS,
                        overflow: "hidden"
                    }}>
                        <div style={{
                                backgroundColor: progressColor,
                                width: (barPercent * 100) + "%",
                                height: "100%"
                            }}
                        />
                        { barMessage &&
                            <div className="flex align-center absolute spread text-white text-bold px2">
                                <IconBorder borderWidth={2}>
                                    <Icon name="check" size={14} />
                                </IconBorder>
                                <div className="pl2">{barMessage}</div>
                            </div>
                        }
                    </div>
                    <div className="mt1">
                        <span className="float-left">0</span>
                        <span className="float-right">Goal {formatValue(goal, { comma: true })}</span>
                    </div>
                </div>
            </div>
        );
    }
}
