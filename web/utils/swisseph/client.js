"use strict";
/**
 * Swiss Ephemeris API Client
 * Connects to remote Swiss Ephemeris calculation server
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
exports.testConnection = exports.getNatalChart = exports.calculateTransits = exports.calculateHouses = exports.calculatePlanets = void 0;
// Configure your API endpoint here
var API_BASE_URL = process.env.EXPO_PUBLIC_SWISSEPH_API_URL ||
    'https://astrologyapp-production.up.railway.app';
/**
 * Calculate planetary positions for a given date/time
 */
var calculatePlanets = function (date, time, timezone) { return __awaiter(void 0, void 0, void 0, function () {
    var response, data, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("".concat(API_BASE_URL, "/api/planets"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            date: date,
                            time: time,
                            timezone: timezone,
                        }),
                    })];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                if (!data.success) {
                    throw new Error(data.error || 'Failed to calculate planetary positions');
                }
                return [2 /*return*/, data.positions];
            case 3:
                error_1 = _a.sent();
                console.error('Error fetching planetary positions:', error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.calculatePlanets = calculatePlanets;
/**
 * Calculate house cusps for a given date/time and location
 */
var calculateHouses = function (date_1, time_1, timezone_1, latitude_1, longitude_1) {
    var args_1 = [];
    for (var _i = 5; _i < arguments.length; _i++) {
        args_1[_i - 5] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([date_1, time_1, timezone_1, latitude_1, longitude_1], args_1, true), void 0, function (date, time, timezone, latitude, longitude, system) {
        var requestBody, response, data, housesArray, i, house, angles, error_2;
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (system === void 0) { system = 'placidus'; }
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    _j.trys.push([0, 3, , 4]);
                    requestBody = {
                        date: date,
                        time: time,
                        timezone: timezone,
                        latitude: latitude,
                        longitude: longitude,
                        system: system,
                    };
                    console.log('🏠 Calculating houses with params:', requestBody);
                    return [4 /*yield*/, fetch("".concat(API_BASE_URL, "/api/houses"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(requestBody),
                        })];
                case 1:
                    response = _j.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _j.sent();
                    if (!data.success) {
                        throw new Error(data.error || 'Failed to calculate houses');
                    }
                    if (!data.houses) {
                        console.error('Missing houses data:', data);
                        throw new Error('Missing houses data from API');
                    }
                    housesArray = void 0;
                    if (Array.isArray(data.houses)) {
                        housesArray = data.houses;
                    }
                    else if (typeof data.houses === 'object') {
                        // Convert object format {"1": {cusp: ...}, "2": {cusp: ...}} to array
                        housesArray = [];
                        for (i = 1; i <= 12; i++) {
                            house = data.houses[i.toString()];
                            if (house && house.cusp !== null && house.cusp !== undefined) {
                                housesArray.push(house.cusp);
                            }
                            else {
                                console.error("Invalid cusp data for house ".concat(i, ":"), house);
                                throw new Error("Invalid or missing cusp data for house ".concat(i));
                            }
                        }
                    }
                    else {
                        console.error('Invalid houses data structure:', data.houses);
                        throw new Error('Invalid houses data structure from API');
                    }
                    if (!data.angles) {
                        console.error('Missing angles data:', data);
                        throw new Error('Missing angles data from API');
                    }
                    angles = {
                        ascendant: (_a = data.angles.ascendant) !== null && _a !== void 0 ? _a : (((_b = data.houses['1']) === null || _b === void 0 ? void 0 : _b.cusp) || 0),
                        midheaven: (_c = data.angles.midheaven) !== null && _c !== void 0 ? _c : (((_d = data.houses['10']) === null || _d === void 0 ? void 0 : _d.cusp) || 0),
                        descendant: (_e = data.angles.descendant) !== null && _e !== void 0 ? _e : (((_f = data.houses['7']) === null || _f === void 0 ? void 0 : _f.cusp) || 0),
                        imumCoeli: (_g = data.angles.imumCoeli) !== null && _g !== void 0 ? _g : (((_h = data.houses['4']) === null || _h === void 0 ? void 0 : _h.cusp) || 0),
                    };
                    return [2 /*return*/, {
                            houses: housesArray,
                            angles: angles,
                        }];
                case 3:
                    error_2 = _j.sent();
                    console.error('Error fetching house cusps:', error_2);
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    });
};
exports.calculateHouses = calculateHouses;
/**
 * Calculate current transits relative to natal positions
 */
var calculateTransits = function (natalPositions) { return __awaiter(void 0, void 0, void 0, function () {
    var response, data, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("".concat(API_BASE_URL, "/api/transits"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            natalPositions: natalPositions,
                        }),
                    })];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                if (!data.success) {
                    throw new Error(data.error || 'Failed to calculate transits');
                }
                return [2 /*return*/, {
                        transits: data.transits,
                        currentPositions: data.currentPositions,
                    }];
            case 3:
                error_3 = _a.sent();
                console.error('Error fetching transits:', error_3);
                throw error_3;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.calculateTransits = calculateTransits;
/**
 * Get complete natal chart data
 */
var getNatalChart = function (date_1, time_1, timezone_1, latitude_1, longitude_1) {
    var args_1 = [];
    for (var _i = 5; _i < arguments.length; _i++) {
        args_1[_i - 5] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([date_1, time_1, timezone_1, latitude_1, longitude_1], args_1, true), void 0, function (date, time, timezone, latitude, longitude, houseSystem) {
        var response, data, error_4;
        if (houseSystem === void 0) { houseSystem = 'placidus'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(API_BASE_URL, "/api/natal-chart"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                date: date,
                                time: time,
                                timezone: timezone,
                                latitude: latitude,
                                longitude: longitude,
                                houseSystem: houseSystem,
                            }),
                        })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (!data.success) {
                        throw new Error(data.error || 'Failed to get natal chart');
                    }
                    return [2 /*return*/, data.chart];
                case 3:
                    error_4 = _a.sent();
                    console.error('Error fetching natal chart:', error_4);
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    });
};
exports.getNatalChart = getNatalChart;
/**
 * Test connection to Swiss Ephemeris API
 */
var testConnection = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, data, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("".concat(API_BASE_URL, "/api/health"), {
                        method: 'GET',
                    })];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                return [2 /*return*/, data.success === true];
            case 3:
                error_5 = _a.sent();
                console.error('Error testing Swiss Ephemeris connection:', error_5);
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.testConnection = testConnection;
