import BaseService from './BaseService';
import { OfferModel, GroupedOfferModel, AltOfferModel } from '../Models/FlightModel';
import Utils from '../Utils';
import AirportService from './AirportService';
import { FlightResponse, ItineraryPart, Segment } from './Responses/FlightResponse';
import { PassengerPickerData } from '../Components/TripSearch/Components/PassengerPicker/PassengerPickerData';
import { CabinType } from '../Enums/CabinType';
import { AirportModel } from '../Models/AirportModel';

export default class FlightService extends BaseService {
  private readonly airportService: AirportService;

  constructor(airportService: AirportService, baseURL?: string) {
    super(baseURL);

    this.airportService = airportService;
  }

  async getOffers(
    cabinType: CabinType,
    departure: Date,
    destination: AirportModel,
    origin: AirportModel,
    passengers: PassengerPickerData,
  ): Promise<{
    altOffers: AltOfferModel[];
    offers: GroupedOfferModel[];
  }> {
    if (!(origin && destination && departure)) {
      return { altOffers: [], offers: [] };
    }

    const { adults, children, infants } = passengers;
    const passengerData = {};

    if (adults > 0) {
      Object.assign(passengerData, { ADT: adults });
    }

    if (children > 0) {
      Object.assign(passengerData, { CHD: children });
    }

    if (infants > 0) {
      Object.assign(passengerData, { INF: infants });
    }

    const result = await this.http.post<FlightResponse>(
      'http://40.80.199.170/flights',
      {
        passengers: passengerData,
        searchType: 'BRANDED',
        currency: 'SEK',
        itineraryParts: [
          {
            from: { code: origin.code },
            to: { code: destination.code },
            when: { date: Utils.getDateString(departure) },
          },
        ],
      },
    );

    const altOffers = result.data.unbundledAlternateDateOffers[0]
      .filter((altOffer) => altOffer.status === 'AVAILABLE')
      .map((altOffer) => ({
        departure: new Date(altOffer.departureDates[0]),
        total: {
          amount: altOffer.total.alternatives[0][0].amount,
          currency: altOffer.total.alternatives[0][0].currency,
        },
      }));

    const offers = result.data.unbundledOffers[0];
    const { fareFamilies } = result.data;
    const store: { [key: string]: any } = {};

    const parsedOffers: OfferModel[] = offers.map((offer) => ({
      cabinClass: offer.cabinClass,
      soldout: offer.soldout,
      brandLabel: fareFamilies
        .find((ff) => ff.brandId === offer.brandId)?.brandLabel
        .find((bl) => bl.languageId === 'en_GB')?.marketingText ?? 'Unknown',
      total: {
        amount: offer.total.alternatives[0][0].amount,
        currency: offer.total.alternatives[0][0].currency,
      },
      itineraryPart: this.getItineraryPart(offer.itineraryPart[0], store),
    }));

    const airportReqs = Object.keys(store)
      .filter((key) => store[key].type === 'segment')
      .map((key) => this.populateAirports(store[key]));

    await Promise.all(airportReqs);

    return {
      altOffers,
      offers: this.groupOffers(parsedOffers),
    };
  }

  private groupOffers(offers: OfferModel[]): GroupedOfferModel[] {
    const result: {
      [key: string]: GroupedOfferModel;
    } = {};

    offers.forEach((offer) => {
      let identifier = '';

      offer.itineraryPart.segments.forEach((segment) => {
        identifier += `${segment.origin.code};${segment.destination.code};${
          segment.departure};${segment.arrival}`;
      });

      if (Object.keys(result).indexOf(identifier) !== -1) {
        // Unique flight.
        if (!result[identifier].cabinClasses[offer.cabinClass]) {
          // Cabin class is not yet added.
          result[identifier].cabinClasses[offer.cabinClass] = {
            startingFrom: offer.total,
            flights: [offer],
          };
        } else {
          // Cabin class already added.
          const cabinClass = result[identifier].cabinClasses[offer.cabinClass];

          if (
            cabinClass.flights.findIndex(
              (flight) => flight.itineraryPart.bookingClass === offer.itineraryPart.bookingClass
              && flight.total.amount === offer.total.amount,
            ) === -1
          ) {
            // Unqique price/booking class, add it.
            cabinClass.flights.push(offer);
          }

          if (offer.total.amount < cabinClass.startingFrom.amount) {
            // Lowest price.
            cabinClass.startingFrom = offer.total;
          }
        }

        return;
      }

      const startSegment = offer.itineraryPart.segments[0];
      const endSegment = offer.itineraryPart.segments[offer.itineraryPart.segments.length - 1];

      result[identifier] = {
        segments: offer.itineraryPart.segments,
        cabinClasses: { [offer.cabinClass]: { flights: [offer], startingFrom: offer.total } },
        departure: startSegment.departure,
        arrival: endSegment.arrival,
        origin: startSegment.origin,
        destination: endSegment.destination,
        stops: offer.itineraryPart.segments.slice(1).map((segment) => segment.origin.code),
      };
    });

    return Object.keys(result).map((key) => result[key]);
  }

  private async populateAirports(data: any): Promise<void> {
    if (!data.origin) {
      Object.assign(data, { origin: await this.airportService.getAirport(data.originCode) });
    }

    if (!data.destination) {
      Object.assign(
        data,
        { destination: await this.airportService.getAirport(data.destinationCode) },
      );
    }
  }

  private getItineraryPart(data: ItineraryPart, store: { [key: string]: any }): any {
    if (data['@ref'] !== undefined) {
      if (!store[data['@ref']]) {
        Object.assign(store, { [data['@ref']]: {} });
      }

      return store[data['@ref']];
    }

    const segments = data.segments.map((segment) => this.getSegment(segment, store));

    return Object.assign(store, {
      [data['@id']]: {
        bookingClass: data.bookingClass,
        type: 'itinerary',
        segments,
      },
    })[data['@id']];
  }

  private getSegment(data: Segment, store: { [key: string]: any }): any {
    if (data['@ref'] !== undefined) {
      if (!store[data['@ref']]) {
        Object.assign(store, { [data['@ref']]: {} });
      }

      return store[data['@ref']];
    }

    return Object.assign(store, {
      [data['@id']]: {
        type: 'segment',
        arrival: new Date(data.arrival),
        departure: new Date(data.departure),
        cabinClass: data.cabinClass,
        bookingClass: data.bookingClass,
        destinationCode: data.destination,
        originCode: data.origin,
        flight: {
          airlineCode: data.flight.airlineCode,
          flightNumber: data.flight.flightNumber,
          operatingAirlineCode: data.flight.operatingAirlineCode,
        },
      },
    })[data['@id']];
  }
}