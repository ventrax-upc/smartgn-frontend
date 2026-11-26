import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-legal',
  imports: [MatIcon, RouterLink, TranslatePipe],
  templateUrl: './profile-legal.html',
  styleUrl: './profile.css',
})
export class ProfileLegalPage {
  protected readonly documentKey = 'legal.' + inject(ActivatedRoute).snapshot.data['document'];
  protected readonly sections = [0, 1, 2, 3];
}
