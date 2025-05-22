import { GetRoomsResponse, RoomGetByID, RoomSearchParams } from "../types/room.type";
import http from "../utils/http";
import { SuccessResponse } from "../types/utils.type";
import {
  Amenity,
  CreateRoomDTO,
  SurroundingArea,
  TargetAudience,
} from "../types/room.type";
import axios from "axios";

export const URL_GET_ROOMS = "api/v1/rooms";
export const URL_SEARCH_ROOMS = "api/v1/rooms/search";
export const URL_GET_WISH_LIST = "api/v1/users/wish-list";
export const URL_GET_ROOM_BY_ID = "api/v1/rooms";
export const URL_ADD_TO_WISH_LIST = "api/v1/users/wish-list";
export const URL_REMOVE_FROM_WISH_LIST = "api/v1/users/wish-list";
export const URL_GET_ROOM_BY_ID_WISH_LIST = "api/v1/users/wish-list/ids";

const externalHttp = axios.create({
  baseURL: "https://trotot-backend-recommendation-service-1-0.onrender.com/",
  headers: {
    "Content-Type": "application/json",
  },
});
export const AI_TRAIN_MODE = "api/v1/recommend/train"
export const AI_SIMILAR_ROOM = "api/v1/recommend/similar"

const roomApi = {
  getRooms(
    params: {
      page?: number;
      size?: number;
      sort?: string;
      roomType?: "APARTMENT" | "WHOLE_HOUSE" | "BOARDING_HOUSE";
    } = {}
  ) {
    const { page = 0, size = 25, sort = "createdAt,desc", roomType } = params;

    return http.get<GetRoomsResponse>(URL_GET_ROOMS, {
      params: { page, size, sort, roomType },
    });
  },


  saveRoom(room: CreateRoomDTO) {
    return http.post<SuccessResponse<CreateRoomDTO>>(URL_GET_ROOMS, room);
  },


  createRoom(formData: FormData) {
    return http.post<SuccessResponse<any>>(URL_GET_ROOMS, formData);
  },

  getAmenities() {
    return http.get<SuccessResponse<Amenity[]>>(URL_GET_ROOMS + "/amenities");
  },

  getTargetAudiences() {
    return http.get<SuccessResponse<TargetAudience[]>>(
      URL_GET_ROOMS + "/target-audiences"
    );
  },

  getSurroundingAreas() {
    return http.get<SuccessResponse<SurroundingArea[]>>(
      URL_GET_ROOMS + "/surrounding-areas"
    );
  },

  searchRooms(params: RoomSearchParams = {}) {
    const {
      page = 0,
      size = 25,
      sort = "createdAt,desc",
    } = params;
    const formattedParams: Record<
      string,
      string | number | boolean | string[] | undefined
    > = {
      ...params,
      page,
      size,
      sort,
    };

    // Handle array parameters
    if (Array.isArray(params.amenities)) {
      formattedParams.amenities = params.amenities.join(",");
    }

    if (Array.isArray(params.environment)) {
      formattedParams.environment = params.environment.join(",");
    }

    if (Array.isArray(params.targetAudience)) {
      formattedParams.targetAudience = params.targetAudience.join(",");
    }

    return http.get<GetRoomsResponse>(URL_SEARCH_ROOMS, {
      params: formattedParams,
    });
  },

  getRoomById(id: number) {
    return http.get<SuccessResponse<RoomGetByID>>(`${URL_GET_ROOMS}/${id}`);
  },

  // Wish List
  getWishList(params: { page?: number; size?: number } = {}) {
    const { page = 0, size = 25 } = params;
    return http.get<GetRoomsResponse>(URL_GET_WISH_LIST, {
      params: { page, size },
    });
  },
  
  addToWishList(id: number) {
    return http.post<SuccessResponse<any>>(`${URL_ADD_TO_WISH_LIST}/${id}`);
  },

  removeFromWishList(id: number) {
    return http.delete<SuccessResponse<any>>(`${URL_REMOVE_FROM_WISH_LIST}/${id}`);
  },
  
  getSavedRoomIds() {
    return http.get<SuccessResponse<{ roomIds: number[] }>>(`${URL_GET_ROOM_BY_ID_WISH_LIST}`);
  },

  aiGetSimilarRoom(id: number) {
    return externalHttp.get<SuccessResponse<any>>(`${AI_SIMILAR_ROOM}/${id}`);
  },

  aiTrainMode() {
    return externalHttp.get<SuccessResponse<any>>(`${AI_TRAIN_MODE}`);
  },
  getRoomOFUser(id: number) {
    return http.get<GetRoomsResponse>(`${URL_GET_ROOMS}/by-user`);
  },

};

export default roomApi;
