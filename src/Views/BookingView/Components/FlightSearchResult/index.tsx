import React from 'react';

import css from './FlightSearchResult.module.css';
import spinner from '../../../../Assets/Images/spinner.svg';
import flightIcon from '../../../../Assets/Images/flight.svg';
import { GroupedOfferModel, AltOfferModel, OfferModel } from '../../../../Models/OfferModel';
import FlightService from '../../../../Services/FlightService';
import DayRibbon from './Components/DayRibbon';
import FlightEntry from './Components/FlightEntry';
import { PassengerPickerData } from '../../../../Components/TripSearch/Components/PassengerPicker/PassengerPickerData';
import { CabinType } from '../../../../Enums/CabinType';
import { AirportModel } from '../../../../Models/AirportModel';
import Select from '../../../../Components/UI/Select';
import Option from '../../../../Components/UI/Select/Option';
import SortAlgorithms, { SortAlgorithm } from './SortAlgorithms';

interface FlightSearchResultProps {
  passengers: PassengerPickerData;
  cabinType: CabinType;
  origin: AirportModel;
  destination: AirportModel;
  departure: Date;
  flightService: FlightService;
  className?: string;
  onDepartureChange?: (departure: Date) => void;
  onOfferChange: (offer?: OfferModel) => void;
  selectedOffer?: OfferModel;
  selectedOfferHash?: number;
}

interface FlightSearchResultState {
  offers?: GroupedOfferModel[];
  altOffers?: AltOfferModel[];
  showCountFactor: number;
  sortingAlgorithm: SortAlgorithm;
  filters?: (groupedOffer: GroupedOfferModel) => boolean;
}

export default class FlightSearchResult extends React.Component<
  FlightSearchResultProps,
  FlightSearchResultState
> {
  private readonly flightEntryRefs: (FlightEntry | null)[] = [];

  private readonly showCount = 5;

  constructor(props: FlightSearchResultProps) {
    super(props);

    this.state = {
      offers: undefined,
      altOffers: undefined,
      showCountFactor: 1,
      sortingAlgorithm: SortAlgorithms.departure,
      filters: undefined,
    };

    this.onDepartureChange = this.onDepartureChange.bind(this);
    this.onFlightEntryExpandDetails = this.onFlightEntryExpandDetails.bind(this);
    this.onSortingChange = this.onSortingChange.bind(this);
    this.onFiltersChange = this.onFiltersChange.bind(this);
  }

  async componentDidMount(): Promise<void> {
    await this.search();

    this.expandSelectedIntoView();
  }

  componentDidUpdate(prevProps: FlightSearchResultProps): void {
    const {
      passengers,
      cabinType,
      origin,
      destination,
      departure,
    } = this.props;

    if (
      passengers !== prevProps.passengers
      || cabinType !== prevProps.cabinType
      || origin !== prevProps.origin
      || destination !== prevProps.destination
      || departure !== prevProps.departure
    ) {
      this.search();
    }
  }

  private onDepartureChange(departure: Date): void {
    const { onDepartureChange, onOfferChange } = this.props;

    onOfferChange(undefined);

    if (onDepartureChange) {
      onDepartureChange(departure);
    }
  }

  private onFlightEntryExpandDetails(): void {
    this.flightEntryRefs.forEach((flightEntryRef) => {
      if (flightEntryRef) {
        flightEntryRef.collapseDetails();
      }
    });
  }

  private onSortingChange(sortingAlgorithm: SortAlgorithm): void {
    this.onFlightEntryExpandDetails();

    this.setState({ sortingAlgorithm }, this.expandSelectedIntoView);
  }

  private onFiltersChange(filters: any): void {
    this.onFlightEntryExpandDetails();

    this.setState({ filters }, this.expandSelectedIntoView);
  }

  private getFilteredAndSorted(offers: GroupedOfferModel[]): GroupedOfferModel[] {
    const { sortingAlgorithm, filters } = this.state;

    let nextOffers = offers;

    if (filters) {
      nextOffers = nextOffers.filter(filters);
    }

    return nextOffers.sort(sortingAlgorithm);
  }

  private expandSelectedIntoView(): void {
    const { selectedOfferHash } = this.props;
    const { offers, showCountFactor } = this.state;

    if (offers && selectedOfferHash !== undefined) {
      // Expand search result to show selected offer.
      this.getFilteredAndSorted(offers).forEach((offer, idx) => {
        Object.keys(offer.cabinClasses).forEach((cc) => {
          if (offer.cabinClasses[cc].offers.findIndex(
            (ccOffer) => ccOffer.basketHash === selectedOfferHash,
          ) !== -1) {
            if (idx >= showCountFactor * this.showCount) {
              this.setState({
                showCountFactor: Math.ceil((idx + 1) / this.showCount),
              });
            }
          }
        });
      });
    }
  }

  private async search(): Promise<void> {
    const {
      flightService,
      cabinType,
      departure,
      destination,
      origin,
      passengers,
      selectedOfferHash,
      onOfferChange,
    } = this.props;

    this.setState({ offers: undefined, showCountFactor: 1 });
    const { offers, altOffers } = await flightService.getOffers(
      cabinType,
      departure,
      destination,
      origin,
      passengers,
    );

    this.setState({
      offers,
      altOffers,
    });

    if (selectedOfferHash !== undefined) {
      offers.forEach((offer) => {
        Object.keys(offer.cabinClasses).forEach((cc) => {
          offer.cabinClasses[cc].offers.forEach((ccOffer) => {
            if (ccOffer.basketHash === selectedOfferHash) {
              onOfferChange(ccOffer);
            }
          });
        });
      });
    }
  }

  private renderResult(offers: GroupedOfferModel[], altOffers: AltOfferModel[]): JSX.Element {
    if (offers.length === 0) {
      return (
        <div className={css.NoResult}>
          No flights found.
        </div>
      );
    }

    const { showCountFactor } = this.state;
    const {
      departure,
      onOfferChange,
      selectedOffer,
      selectedOfferHash,
    } = this.props;
    const showCount = showCountFactor * this.showCount;

    return (
      <>
        <DayRibbon
          selectedDate={departure}
          className={css.DayRibbon}
          altOffers={altOffers}
          onChange={this.onDepartureChange}
        />

        <div className={css.FlightEntries}>
          {this.getFilteredAndSorted(offers).slice(0, showCount).map((flight, idx) => (
            <FlightEntry
              ref={(ref): void => {
                this.flightEntryRefs[idx] = ref;
              }}
              data={flight}
              key={`flight-entry-${idx}`}
              onExpandDetails={this.onFlightEntryExpandDetails}
              onOfferChange={onOfferChange}
              selectedOffer={selectedOffer}
              selectedOfferHash={selectedOfferHash}
            />
          ))}

          {showCount < offers.length && (
            <div className={css.ShowMore}>
              <button
                type="button"
                onClick={(): void => this.setState({ showCountFactor: showCountFactor + 1 })}
              >
                {`${offers.length - showCount} more flights`}
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  render(): JSX.Element {
    const { origin, destination, className } = this.props;
    const {
      offers,
      altOffers,
      sortingAlgorithm,
    } = this.state;

    const classList = [css.FlightSearchResult];

    if (className) {
      classList.push(className);
    }

    return (
      <div className={classList.join(' ')}>
        <div className={css.Header}>
          <div className={css.OriginDestination}>
            <img src={flightIcon} alt="Flight" />
            <strong>
              {`${origin?.cityName} to ${destination?.cityName}`}
            </strong>
          </div>

          <div className={css.Actions}>
            <Select
              className={css.Sorting}
              wrapperClassName={css.SortingWrapper}
              value={sortingAlgorithm}
              onChange={this.onSortingChange}
            >
              <Option value={SortAlgorithms.departure}>Departure</Option>
              <Option value={SortAlgorithms.arrival}>Arrival</Option>
              <Option value={SortAlgorithms.stopCount}>Number of stops</Option>
              <Option value={SortAlgorithms.travelTime}>Travel time</Option>
              <Option value={SortAlgorithms.economyPrice}>Economy price</Option>
              <Option value={SortAlgorithms.businessPrice}>Business price</Option>
            </Select>
          </div>

        </div>

        <div className={css.Result}>
          {!offers
            ? (
              <strong className={css.Searching}>
                <img src={spinner} alt="Searching" />
                Searching
              </strong>
            )
            : (this.renderResult(offers, altOffers ?? []))}
        </div>
      </div>
    );
  }
}
