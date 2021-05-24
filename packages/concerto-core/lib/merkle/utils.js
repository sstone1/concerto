'use strict';

/**
 * Determine if two paths are equal.
 * @param {*} p1 the path.
 * @param {*} p2 the path.
 * @returns {boolean} true if the two paths are equal, false otherwise.
 */
function pathEquals(p1, p2) {
    if (p1.length !== p2.length) {
        return false;
    }
    for (let i = 0; i < p1.length; i++) {
        if (p1[i] !== p2[i]) {
            return false;
        }
    }
    return true;
}

/**
 * Split the specified proof into before, child, and after.
 * @param {*} p the proof.
 * @returns {object} the split proof.
 */
function splitProof(p) {
    const before = [], after = [];
    let child = null;
    for (const e of p) {
        if (!Buffer.isBuffer(e)) {
            child = e;
            continue;
        } else if (!child) {
            before.push(e);
        } else {
            after.push(e);
        }
    }
    return { before, child, after };
}

module.exports = {
    pathEquals,
    splitProof
};