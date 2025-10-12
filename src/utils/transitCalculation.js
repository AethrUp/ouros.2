"use strict";
/**
 * Transit Calculation Utility
 * Uses server-side Swiss Ephemeris calculations
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTransitData = exports.getTropicalTransits = exports.getNatalTransits = void 0;
var client_1 = require("./swisseph/client");
/**
 * Get natal transits for a specific date
 */
var getNatalTransits = function (userProfile_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([userProfile_1], args_1, true), void 0, function (userProfile, targetDate) {
        var birthDate, birthTime, birthLocation, date, time, hour, minute, timezone, natalPlanets, natalPositions_1, transitData, aspects, majorAspectTypes_1, majorAspects, error_1;
        if (targetDate === void 0) { targetDate = new Date(); }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    birthDate = userProfile.birthDate, birthTime = userProfile.birthTime, birthLocation = userProfile.birthLocation;
                    if (!birthDate) {
                        throw new Error('Birth date is required');
                    }
                    date = void 0;
                    if (typeof birthDate === 'string') {
                        date = birthDate.includes('T') ? birthDate.split('T')[0] : birthDate;
                    }
                    else {
                        date = birthDate;
                    }
                    time = '12:00';
                    if (birthTime) {
                        if (typeof birthTime === 'string') {
                            time = birthTime;
                        }
                        else if (typeof birthTime === 'object' && birthTime.hour !== undefined && birthTime.minute !== undefined) {
                            hour = String(birthTime.hour).padStart(2, '0');
                            minute = String(birthTime.minute).padStart(2, '0');
                            time = "".concat(hour, ":").concat(minute);
                        }
                    }
                    timezone = (birthLocation === null || birthLocation === void 0 ? void 0 : birthLocation.timezoneOffset) !== undefined
                        ? birthLocation.timezoneOffset / 3600
                        : 0;
                    return [4 /*yield*/, (0, client_1.calculatePlanets)(date, time, timezone)];
                case 1:
                    natalPlanets = _a.sent();
                    natalPositions_1 = {};
                    Object.entries(natalPlanets).forEach(function (_a) {
                        var planet = _a[0], data = _a[1];
                        if (data && data.longitude !== undefined) {
                            natalPositions_1[planet] = data.longitude;
                        }
                    });
                    return [4 /*yield*/, (0, client_1.calculateTransits)(natalPositions_1)];
                case 2:
                    transitData = _a.sent();
                    aspects = transitData.transits.map(function (transit) { return ({
                        transitPlanet: transit.transitPlanet,
                        natalPlanet: transit.natalPlanet,
                        aspect: transit.aspect,
                        orb: transit.orb,
                        strength: transit.strength,
                        transitInfo: {
                            isRetrograde: transit.isRetrograde || false,
                        },
                    }); });
                    majorAspectTypes_1 = ['Conjunction', 'Opposition', 'Square', 'Trine', 'Sextile'];
                    majorAspects = aspects.filter(function (a) {
                        return majorAspectTypes_1.includes(a.aspect);
                    });
                    return [2 /*return*/, {
                            aspects: aspects,
                            summary: {
                                totalAspects: aspects.length,
                                majorAspects: majorAspects.length,
                                activeAspects: aspects.length,
                                strongestAspect: aspects[0] || null,
                            },
                            metadata: {
                                calculatedAt: new Date().toISOString(),
                                dataSource: 'Railway Swiss Ephemeris Calculations',
                                precision: 'Professional Grade',
                            },
                        }];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error calculating natal transits:', error_1);
                    throw new Error("Natal transits calculation failed: ".concat(error_1.message));
                case 4: return [2 /*return*/];
            }
        });
    });
};
exports.getNatalTransits = getNatalTransits;
/**
 * Get tropical transits (current planetary positions)
 */
var getTropicalTransits = function () { return __awaiter(void 0, void 0, void 0, function () {
    var now, date, hours, minutes, time, positions, formattedPositions_1, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                now = new Date();
                date = now.toISOString().split('T')[0];
                hours = now.getUTCHours();
                minutes = now.getUTCMinutes();
                time = "".concat(hours.toString().padStart(2, '0'), ":").concat(minutes.toString().padStart(2, '0'));
                return [4 /*yield*/, (0, client_1.calculatePlanets)(date, time, 0)];
            case 1:
                positions = _a.sent();
                formattedPositions_1 = {};
                Object.entries(positions).forEach(function (_a) {
                    var planet = _a[0], data = _a[1];
                    if (data) {
                        formattedPositions_1[planet] = {
                            position: data.longitude,
                            sign: data.sign,
                            degree: data.degree,
                            retrograde: data.isRetrograde,
                            formatted: data.formattedPosition,
                        };
                    }
                });
                return [2 /*return*/, {
                        success: true,
                        data: {
                            positions: formattedPositions_1,
                            calculatedAt: now.toISOString(),
                            method: 'swiss-ephemeris-api',
                        },
                    }];
            case 2:
                error_2 = _a.sent();
                console.error('Error calculating tropical transits:', error_2);
                return [2 /*return*/, {
                        success: false,
                        error: error_2.message,
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getTropicalTransits = getTropicalTransits;
/**
 * Validate transit data structure
 */
var validateTransitData = function (transitData) {
    if (!transitData)
        return false;
    var isValid = transitData.aspects &&
        Array.isArray(transitData.aspects) &&
        transitData.summary &&
        transitData.metadata;
    if (!isValid) {
        console.error('Transit data validation failed:', {
            hasAspects: !!transitData.aspects,
            aspectsIsArray: Array.isArray(transitData.aspects),
            hasSummary: !!transitData.summary,
            hasMetadata: !!transitData.metadata,
        });
    }
    return isValid;
};
exports.validateTransitData = validateTransitData;
