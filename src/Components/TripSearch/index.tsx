import React from 'react';

import './TripSearch.css';
import { TripType } from '../../Types/TripType';
import { CabinType } from '../../Types/CabinType';
import AirportService from '../../Services/AirportService';
import PassengerPicker, { PassengerPickerData } from '../PassengerPicker';
import OriginDestinationPicker, { OriginDestinationPickerData } from '../OriginDestinationPicker';
import DatePicker from '../DatePicker';
import TripTypePicker from '../TripTypePicker';
import Select from '../UI/Select';
import Option from '../UI/Select/Option';
import { CalendarData } from '../Calendar';
import Checkbox from '../UI/Checkbox';

export interface TripSearchData {
  tripType: TripType;
  passengers: PassengerPickerData;
  cabinType: CabinType;
  originDestination: OriginDestinationPickerData;
  dates: CalendarData;
  bookWithMiles: boolean;
}

interface TripSearchProps {
  data: TripSearchData;
  locale: string;
  onChange: (data: TripSearchData) => void;
  airportService: AirportService;
}

export default class TripSearch extends React.Component<TripSearchProps, {}> {
  static readonly defaultProps: Pick<TripSearchProps, 'locale'> = {
    locale: 'en-US',
  };

  constructor(props: TripSearchProps) {
    super(props);

    this.onTripTypeChange = this.onTripTypeChange.bind(this);
    this.onPassengersChange = this.onPassengersChange.bind(this);
    this.onCabinTypeChange = this.onCabinTypeChange.bind(this);
    this.onOriginDestinationChange = this.onOriginDestinationChange.bind(this);
    this.onDatesChange = this.onDatesChange.bind(this);
  }

  private onTripTypeChange(tripType: TripType): void {
    this.onFieldChange('tripType', tripType);
  }

  private onPassengersChange(passengers: PassengerPickerData): void {
    this.onFieldChange('passengers', passengers);
  }

  private onCabinTypeChange(cabinType: CabinType): void {
    this.onFieldChange('cabinType', cabinType);
  }

  private onOriginDestinationChange(originDestination: OriginDestinationPickerData): void {
    this.onFieldChange('originDestination', originDestination);
  }

  private onDatesChange(dates: CalendarData): void {
    this.onFieldChange('dates', dates);
  }

  private onBookWithMilesChange(bookWithMiles: boolean): void {
    this.onFieldChange('bookWithMiles', bookWithMiles);
  }

  private onFieldChange(fieldName: string, value: any): void {
    const { data, onChange } = this.props;

    Object.assign(data, { [fieldName]: value });

    onChange(data);
  }

  render(): JSX.Element {
    const { data, airportService, locale } = this.props;

    return (
      <div className="trip-search">
        <TripTypePicker
          value={data.tripType}
          onChange={this.onTripTypeChange}
        />
        <OriginDestinationPicker
          data={data.originDestination}
          onChange={this.onOriginDestinationChange}
          airportService={airportService}
        />
        <DatePicker
          locale={locale}
          data={data.dates}
          onChange={this.onDatesChange}
          span={data.tripType === 'return'}
        />
        <div className="cabin-type">
          <label htmlFor="cabin-type">Cabin</label>
          <Select
            id="cabin-type"
            value={data.cabinType}
            onChange={this.onCabinTypeChange}
          >
            <Option value="all">All cabins</Option>
            <Option value="economy">Economy</Option>
            <Option value="business">Business</Option>
            <Option value="first">First Class</Option>
            <Option value="residence">Residence</Option>
          </Select>
        </div>
        <div className="passengers">
          <label htmlFor="passengers">Guests</label>
          <PassengerPicker
            id="passengers"
            data={data.passengers}
            onChange={this.onPassengersChange}
          />
        </div>
        <div className="search-flight">
          <div className="book-with-miles">
            <Checkbox
              checked={data.bookWithMiles}
              id="book-with-miles"
              onChange={(e): void => this.onBookWithMilesChange(e.target.checked)}
            >
              Book with miles
            </Checkbox>
          </div>
          <button
            type="button"
            onClick={(): void => console.log(data)}
          >
            Search flight
          </button>
        </div>
      </div>
    );
  }
}
