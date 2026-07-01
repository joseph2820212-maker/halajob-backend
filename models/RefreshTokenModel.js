import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true,
  },
  loginTime: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  device:{
    type:Object,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // Reuse-detection fields (P1-03). A "family" is the chain of refresh
  // tokens produced by successive rotations from a single login. Each row
  // records:
  //   - family_id: the shared identifier for the chain.
  //   - jti:       the JWT ID of the token stored in this row.
  //   - is_active: false once the row has been rotated out. Only the head
  //                of the chain is ever true. Retired rows stick around
  //                until the TTL expires so an attacker replaying a
  //                previously-rotated token can be detected.
  //   - retired_at: when the row was rotated out (null while active).
  //
  // These fields are optional-with-defaults because rows created before
  // the migration land with legacy tokens still need to work. Any row
  // whose family_id/jti is null is treated as a legacy row on rotation
  // and gets back-filled to a fresh family.
  family_id: {
    type: String,
    default: null,
    index: true,
  },
  jti: {
    type: String,
    default: null,
    index: true,
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true,
  },
  retired_at: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshTokenModel;
