import { Injectable } from '@angular/core';

import { Effect, Actions } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { PlaceService } from './services';
import { AppControlActions } from './app-controls.action';
import { AppControlReducer } from './app-controls.reducer';
import { BikePointsService } from '../bikepoints';
import { AppState } from './models';
import { BikePoint } from '../models';
import { JourneyMapActions } from '../journey-map/journey-map.action';

@Injectable()
export class AppControlEffects {
  @Effect()
  appState$: Observable<Action> = this.actions$
    .ofType(AppControlActions.SET_APP_STATE)
    .switchMap((action: AppControlActions.SetAppStateAction) => {
      switch (action.payload) {
        case AppState.CONFIRM_JOURNEY:
        case AppState.IN_JOURNEY:
          return [new JourneyMapActions.PopulateBikepointsAction([])];
        default:
          return [];
      }
    });

  @Effect()
  searchBikepoint$: Observable<Action> = this.actions$
    .ofType(AppControlActions.SEARCH_BIKEPOINT)
    .switchMap((action: AppControlActions.SearchBikepointAction) =>
      this.bpService.searchBikepoint(action.payload))
    .switchMap((result: BikePoint[]) => {
      return [
        new AppControlActions.UpdateBikepointSearchResultAction(result)
      ];
    });

  @Effect()
  fromLoc$: Observable<Action> = this.actions$
    .ofType(AppControlActions.SELECT_FROM_BIKEPOINT)
    .filter((action: AppControlActions.SelectFromBikepointAction) => Boolean(action.payload))
    .withLatestFrom(this.store.select(AppControlReducer.selectors.toLoc))
    .switchMap(([action, toLoc]: [
      AppControlActions.SelectFromBikepointAction,
      BikePoint | null
    ]) => {
      return [
        new AppControlActions.UpdateBikepointSearchResultAction([]),
        new AppControlActions.UpdatePlaceSearchResultAction([]),
        new AppControlActions.SetFromFieldAction(action.payload.commonName),
        new AppControlActions.SetAppStateAction(
          /**
           *  If `to` bikepoint is set, set state to proceed to confirm journey
           *  If not, proceed to `to input`
           */
          toLoc ? AppState.CONFIRM_JOURNEY : AppState.TO_INPUT
        ),
      ];
    });

  @Effect()
  toLoc$: Observable<Action> = this.actions$
    .ofType(AppControlActions.SELECT_TO_BIKEPOINT)
    .filter((action: AppControlActions.SelectToBikepointAction) => Boolean(action.payload))
    .withLatestFrom(this.store.select(AppControlReducer.selectors.fromLoc))
    .switchMap(([action, fromLoc]: [
      AppControlActions.SelectToBikepointAction,
      BikePoint | null
    ]) => {
      return [
        new AppControlActions.UpdateBikepointSearchResultAction([]),
        new AppControlActions.UpdatePlaceSearchResultAction([]),
        new AppControlActions.SetToFieldAction(action.payload.commonName),
        new AppControlActions.SetAppStateAction(
          /**
           *  If `from` bikepoint is set, set state to proceed to confirm journey
           *  If not, proceed to `from input`
           */
          fromLoc ? AppState.CONFIRM_JOURNEY : AppState.FROM_INPUT
        ),
      ];
    });

  constructor(
    private actions$: Actions,
    private store: Store<AppControlReducer.State>,
    private placeService: PlaceService,
    private bpService: BikePointsService,
  ) { }
}
