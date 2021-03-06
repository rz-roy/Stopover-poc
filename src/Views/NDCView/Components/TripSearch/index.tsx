import React from 'react';

import css from './TripSearch.module.css';
import { TripTypeEnum } from '../../../../Enums/TripTypeEnum';
import OriginDestinationPicker from './Components/OriginDestinationPicker';
import DatePicker from './Components/DatePicker';
import TripTypePicker from './Components/TripTypePicker';
import CabinClassPicker from './Components/CabinClassPicker';
import PassengerPicker from './Components/PassengerPicker';
import Button from '../../../../Components/UI/Button';
import {
  TripModel,
  copyTrip,
  isEqualTrips,
  isTripValid,
} from '../../Models/TripModel';
import { AirportModel } from '../../../../Models/AirportModel';
import ContentService from '../../Services/ContentService';
import AirportService from '../../../../Services/AirportService';

interface TripSearchProps {
  trip?: TripModel;
  contentService: ContentService;
  airportService: AirportService;
  onChange?: (data: TripModel) => void;
  onSearch?: (data: TripModel) => void;
  className?: string;
}

interface TripSearchState {
  trip: TripModel;
  content: {
    common: {
      cabinClasses: { [key: string]: string };
    };
  };
}

class TripSearch extends React.Component<TripSearchProps, TripSearchState> {
  constructor(props: TripSearchProps) {
    super(props);

    const { trip } = props;

    this.state = {
      trip: copyTrip(trip),
      content: {
        common: {
          cabinClasses: {},
        },
      },
    };

    this.onOriginDestinationChange = this.onOriginDestinationChange.bind(this);
    this.onTripTypeChange = this.onTripTypeChange.bind(this);
    this.onDatesChange = this.onDatesChange.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.onFeelingSearch = this.onFeelingSearch.bind(this);
  }

  async componentDidMount(): Promise<void> {
    const { contentService } = this.props;

    this.setState({ content: { common: await contentService.get('common') } });
  }

  componentDidUpdate(prevProps: TripSearchProps): void {
    const { trip } = this.props;

    if (!isEqualTrips(prevProps.trip, trip)) {
      this.setState({ trip: copyTrip(trip) });
    }
  }

  private async onChange(nextTrip: Partial<TripModel>): Promise<void> {
    const { onChange } = this.props;
    const { trip } = this.state;

    Object.assign(trip, nextTrip);

    this.setState({ trip });

    if (onChange) {
      onChange(trip);
    }
  }

  private onOriginDestinationChange(origin?: AirportModel, destination?: AirportModel): void {
    const { trip } = this.state;

    trip.legs[0].origin = origin;
    trip.legs[0].destination = destination;

    if (trip.type === TripTypeEnum.roundTrip) {
      trip.legs[1].origin = destination;
      trip.legs[1].destination = origin;
    }

    this.onChange(trip);
  }

  private onDatesChange(start?: Date, end?: Date): void {
    const { trip } = this.state;

    trip.legs[0].departure = start;

    if (trip.type === TripTypeEnum.roundTrip) {
      trip.legs[1].departure = end;
    }

    this.onChange(trip);
  }

  private onTripTypeChange(type: TripTypeEnum): void {
    const { trip } = this.state;

    if (trip.type === TripTypeEnum.oneWay && type === TripTypeEnum.roundTrip) {
      trip.legs[0].departure = undefined;
    }

    trip.type = type;

    this.onChange(copyTrip(trip));
  }

  private onSearch(): void {
    const { onSearch } = this.props;
    const { trip } = this.state;

    // TODO: Validation.
    if (!isTripValid(trip)) {
      return;
    }

    if (onSearch) {
      onSearch(trip);
    }
  }

  private onFeelingSearch(): void {
    this.onSearch();
  }

  render(): JSX.Element {
    const {
      airportService,
      contentService,
      className,
    } = this.props;

    const { trip, content: { common: { cabinClasses } } } = this.state;

    const classList = [css.TripSearch];

    if (className) {
      classList.push(className);
    }

    return (
      <div className={classList.join(' ')}>
        <div className={css.TopSelector}>
          <TripTypePicker
            className={css.TripTypePicker}
            value={trip.type}
            onChange={this.onTripTypeChange}
          />

          <PassengerPicker
            className={css.PassengerPicker}
            id="passengers"
            data={trip.passengers}
            onChange={(passengers): Promise<void> => this.onChange({ passengers })}
          />

          <CabinClassPicker
            value={trip.cabinClass}
            cabinClasses={cabinClasses}
            onChange={(cabinClass): Promise<void> => this.onChange({ cabinClass })}
          />
        </div>

        <div className={css.LocationDate}>
          <OriginDestinationPicker
            className={css.OriginDestinationPicker}
            origin={trip.legs[0].origin}
            destination={trip.legs[0].destination}
            onChange={this.onOriginDestinationChange}
            airportService={airportService}
          />

          <DatePicker
            className={css.DatePicker}
            contentService={contentService}
            start={trip.legs[0].departure}
            end={trip.legs[1] && trip.legs[1].departure}
            onChange={this.onDatesChange}
            span={trip.type === TripTypeEnum.roundTrip}
          />
        </div>

        <div className={css.SearchFlight}>
          <Button className={css.SearchButton} onClick={this.onSearch}>
            Search flight
          </Button>
          <Button className={css.LuckyButton} onClick={this.onFeelingSearch}>
            I'm feeling lucky
          </Button>
        </div>
      </div>
    );
  }
}

export default TripSearch;
