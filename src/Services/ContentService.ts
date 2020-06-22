import BaseService from './BaseService';

import CityNames from './Content/CityNames';
import CountryNames from './Content/CountryNames';
import AirportNames from './Content/AirportNames';
import FlightModels from './Content/FlightModels';
import TimeZones from './Content/TimeZones';

export default class ContentService extends BaseService {
  async get(resource: string): Promise<any> {
    return this.createRequest(resource, async () => {
      let data;

      switch (resource) {
        case 'timeZones':
          data = TimeZones;
          break;
        case 'flightModels':
          data = FlightModels;
          break;
        case 'cityNames':
          data = CityNames;
          break;
        case 'countryNames':
          data = CountryNames;
          break;
        case 'airportNames':
          data = AirportNames;
          break;
        default:
          data = undefined;
          break;
      }

      return data;
    });
  }
}
